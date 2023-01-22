import pytest
from httpx import AsyncClient
from tortoise import Tortoise
from config import TEST_DB_URI
from main import app
from typing import Callable
from models import Session, Player, Repository, File, SourceCode
from unittest.mock import patch, Mock, AsyncMock
from services.github_client import (
    GithubClient,
    RepositoryDict,
    FileDict,
)
from datetime import datetime
from nanoid import generate

MODELS = [Session, Player, Repository, File, SourceCode]


@pytest.fixture
async def session():
    return await Session.create(id=generate(size=10))


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
async def init_test_db():
    await Tortoise.init(
        db_url=TEST_DB_URI, modules={"models": ["models"]}, _create_db=True
    )
    await Tortoise.generate_schemas()
    yield
    await Tortoise._drop_databases()


@pytest.fixture
async def api_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


def mock_gh_client(
    user_to_repos: Callable[..., list[RepositoryDict]],
    repo_to_files: Callable[..., list[FileDict]],
    file_from_url: Callable[..., str],
):
    gh_client = Mock(spec=GithubClient)
    # note: the below is not the 'correct' way of mocking attributes/methods of the mock object, but in the case where we directly pass
    # the mock object in question into some method, whenever the mock object's below mocked attributes/methods are accessed or called, the
    # mocks created for the accessed attributes or methods will be triggered.
    gh_client.get_non_forked_repos = AsyncMock(side_effect=user_to_repos)
    gh_client.get_files_for_repo = AsyncMock(side_effect=repo_to_files)
    gh_client.download_file_from_url = AsyncMock(side_effect=file_from_url)
    return gh_client


def get_test_repos(user: str, limit: int = 1):
    repos = []
    for i in range(limit):
        repos.append(
            RepositoryDict(
                name=f"{user}/Repo-{i}",
                pushed_at=datetime.now().isoformat(),
                url=f"https://github.com/{user}/Repo-{i}",
                stars=0,
                default_branch="main",
                description="Description for Repo-{i}",
                language="python",
            )
        )
    return repos


def get_test_files(repo: str, limit: int = 1):
    files = []
    for i in range(limit):
        file_name = f"{repo}-filename-{i}.py"
        path = f"src/{file_name}"
        files.append(
            FileDict(
                name=file_name,
                path=path,
                download_url=f"https://raw.githubusercontent.com/{path}",
                visit_url=f"https://github.com/{path}",
            )
        )
    return files


@pytest.fixture
def noop_gh_client():
    def user_to_repos(*args, **kwargs):
        return ([], None)

    def repo_to_files(*args, **kwargs):
        return []

    def file_from_url(*args):
        return ""

    yield mock_gh_client(user_to_repos, repo_to_files, file_from_url)


@pytest.fixture
def patch_gh_client_factory():
    mock_gh_client = Mock(spec=GithubClient)

    def factory(
        user_to_repos: Callable[..., list[RepositoryDict]],
        repo_to_files: Callable[..., list[FileDict]],
    ):
        mock_gh_client.return_value.get_non_forked_repos = AsyncMock(
            side_effect=user_to_repos
        )

        mock_gh_client.return_value.get_files_for_repo = AsyncMock(
            side_effect=repo_to_files
        )
        return mock_gh_client

    with patch("routes.session.GithubClient", new=mock_gh_client):
        yield factory


@pytest.fixture
def patch_to_noop_gh_client(patch_gh_client_factory):
    def user_to_repos(*args, **kwargs):
        return ([], None)

    def repo_to_files(*args, **kwargs):
        return []

    yield patch_gh_client_factory(user_to_repos, repo_to_files)


@pytest.fixture
async def clear_db():
    yield
    for model in MODELS:
        await model.all().delete()
