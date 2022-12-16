import pytest
from httpx import AsyncClient
from tortoise import Tortoise
from config import TEST_DB_URI
from main import app
from typing import Callable
from models import Session, Player, Repository, File
from unittest.mock import patch, Mock, AsyncMock
from services.github_client import (
    GithubClient,
    RepositoryDict,
    FileDict,
)

MODELS = [Session, Player, Repository, File]


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


@pytest.fixture
def mock_gh_client_factory():
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
def empty_gh_client(mock_gh_client_factory):
    def user_to_repos(*args, **kwargs):
        return ([], None)

    def repo_to_files(*args, **kwargs):
        return []

    yield mock_gh_client_factory(user_to_repos, repo_to_files)


@pytest.fixture
async def clear_db():
    yield
    for model in MODELS:
        await model.all().delete()
