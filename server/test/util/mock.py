from typing import Callable, List
from unittest.mock import Mock
from gitgame.services import FileRepository, File, FileRule


# mock file
default_repo = FileRepository("Repo", "Repo Url", 0, "Lang", "Description")


def default_readlines():
    return []


def get_mock_file(
    readlines: Callable[[], List[str]] = default_readlines,
    file_name="file_name.py",
    file_path="./file_path/file_name.py",
    author="Author",
    repo=default_repo,
    size=100,
):
    mock_file = Mock(spec=File)
    mock_file.readlines = readlines
    mock_file.get_filepath.return_value = file_path
    mock_file.get_filename.return_value = file_name
    mock_file.get_repo.return_value = repo
    mock_file.get_author.return_value = author
    mock_file.get_size.return_value = size
    return mock_file


# mock file_rule
def get_mock_file_rule(file_validator: Callable[[File], bool]):
    mock_file_rule = Mock(spec=FileRule)
    mock_file_rule.is_valid = Mock(side_effect=file_validator)
    return mock_file_rule
