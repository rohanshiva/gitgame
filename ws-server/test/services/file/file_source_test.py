from typing import Callable, List
from github import Github
from github.GithubException import GithubException
from github.NamedUser import NamedUser
from github.Repository import Repository
from github.GitTree import GitTree
from github.GitTreeElement import GitTreeElement
from unittest.mock import Mock, patch
from ws.services import LazyGithubFileSource
from ...util import get_mock_file_rule


def get_mock_repo(
    get_git_tree: Callable[[str], GitTree],
    full_name: str = "Repo",
    url: str = "Repo Url",
    stargazers_count: int = 0,
    language: str = None,
    description: str = None,
    default_branch: str = "master",
    fork: bool = False,
):
    mock_repo = Mock(spec=Repository)
    mock_repo.full_name = full_name
    mock_repo.html_url = url
    mock_repo.stargazers_count = stargazers_count
    mock_repo.language = language
    mock_repo.description = description
    mock_repo.default_branch = default_branch
    mock_repo.get_git_tree = Mock(side_effect=get_git_tree)
    mock_repo.fork = fork
    return mock_repo


def get_git_tree_callback(elements: List[tuple[str, str, int]]):
    def to_tree_element(element: tuple[str, str, int]):
        mock_git_tree_element = Mock(spec=GitTreeElement)
        mock_git_tree_element.path = element[0]
        mock_git_tree_element.type = element[1]
        mock_git_tree_element.size = element[2]
        return mock_git_tree_element

    def get_git_tree(branch: str, recursive=True):
        mock_git_tree = Mock(spec=GitTree)
        mock_git_tree.tree = [to_tree_element(element) for element in elements]
        return mock_git_tree

    return get_git_tree


def get_mock_github(repos: List[Repository]):
    mock_named_user = None

    def get_user(user: str):
        nonlocal mock_named_user
        if mock_named_user is None:
            mock_named_user = Mock(spec=NamedUser)
            mock_named_user.public_repos = len(repos)
            mock_named_user.get_repos = Mock(return_value=repos)
        return mock_named_user

    mock_github = Mock(spec=Github)
    mock_github.get_user = Mock(side_effect=get_user)
    return mock_github


SIZE_THRESHOLD = 1000


def test_setup_shouldOnlySetupOnce():
    author = "Big T"
    mock_github = get_mock_github([])
    file_source = LazyGithubFileSource(
        mock_github,
        get_mock_file_rule(lambda _: True),
        author,
    )

    assert file_source.is_setup() is False
    file_source.setup()

    assert file_source.is_setup() is True
    file_source.setup()

    # should only fetch the user & repos only 1 time
    assert mock_github.get_user.call_count == 1

    mock_user = mock_github.get_user(author)
    assert mock_user.get_repos.call_count == 1


def test_whenNonEmptyNonForkRepoLoads_shouldReturnOnlyValidFiles():
    author = "Big T"
    elements = [
        ("src/main.py", LazyGithubFileSource.BLOB, 542),
        ("test.js", LazyGithubFileSource.BLOB, 241),
        ("readme.md", LazyGithubFileSource.BLOB, 15000),
        ("src", LazyGithubFileSource.TREE, 542),
    ]

    repo_name = "NonFork-NonEmpty Repo"

    mock_repo = get_mock_repo(get_git_tree_callback(elements), repo_name)

    mock_github = get_mock_github([mock_repo])
    file_source = LazyGithubFileSource(
        mock_github,
        get_mock_file_rule(lambda file: file.get_size() < SIZE_THRESHOLD),
        author,
    )

    file_source.setup()
    assert file_source.can_get_files() is True

    files = file_source.get_next_files()

    assert len(files) == 2

    expected_metadata_for_file = {
        "src/main.py": {"name": "main.py"},
        "test.js": {"name": "test.js"},
    }

    for file in files:
        assert file.get_size() < SIZE_THRESHOLD
        assert file.get_repo().get_name() == repo_name
        assert file.get_filepath() in expected_metadata_for_file
        assert (
            file.get_filename()
            == expected_metadata_for_file[file.get_filepath()]["name"]
        )

    assert file_source.can_get_files() is False


def test_whenInvalidReposLoad_shouldKeepSkippingUntilValidRepo():
    author = "Big T"
    # invalid repo
    fork_repo = get_mock_repo(get_git_tree_callback([]), "Fork Repo", fork=True)

    def get_git_tree_for_empty_repo(branch: str, recursive: bool = True):
        error_data = {
            "message": "Git Repository is empty.",
            "documentation_url": "https://docs.github.com/rest/reference/git#get-a-tree",
        }
        raise GithubException(409, error_data, None)

    # invalid repo
    empty_repo = get_mock_repo(get_git_tree_for_empty_repo, "Empty Repo")

    elements = [("src/main.py", LazyGithubFileSource.BLOB, 542)]
    valid_repo = get_mock_repo(get_git_tree_callback(elements), "Valid Repo")

    # the repos are popped from the back of sequence first in LazyGithubFileSource
    mock_github = get_mock_github([valid_repo, empty_repo, fork_repo])
    file_source = LazyGithubFileSource(
        mock_github,
        get_mock_file_rule(lambda _: True),
        author,
    )

    # path random.shuffle so a random shuffle doesn't occur in LazyGithubFileSource.setup
    with patch("random.shuffle") as mock_shuffle:
        # noop
        mock_shuffle.side_effect = lambda _: None
        file_source.setup()

    assert file_source.can_get_files() is True
    files = file_source.get_next_files()

    assert fork_repo.get_git_tree.call_count == 0
    assert empty_repo.get_git_tree.call_count == 1

    assert len(files) == 1
    assert files[0].get_filepath() == "src/main.py"
    assert file_source.can_get_files() is False


def test_whenMultipleValidReposExist_shouldLazyLoad():
    author = "Big T"
    valid_repo1 = get_mock_repo(
        get_git_tree_callback([("main.py", LazyGithubFileSource.BLOB, 542)]),
        "Valid Repo 1",
    )
    valid_repo2 = get_mock_repo(
        get_git_tree_callback([("test.py", LazyGithubFileSource.BLOB, 242)]),
        "Valid Repo 2",
    )

    mock_github = get_mock_github([valid_repo2, valid_repo1])
    file_source = LazyGithubFileSource(
        mock_github, get_mock_file_rule(lambda _: True), author
    )

    with patch("random.shuffle") as mock_shuffle:
        mock_shuffle.side_effect = lambda _: None
        file_source.setup()

    assert file_source.can_get_files() is True

    # loads Valid Repo 1
    files = file_source.get_next_files()
    assert len(files) == 1
    assert files[0].get_filename() == "main.py"

    assert file_source.can_get_files() is True

    # loads Valid Repo 2
    files = file_source.get_next_files()
    assert len(files) == 1
    assert files[0].get_filename() == "test.py"

    assert file_source.can_get_files() is False
