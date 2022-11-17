import pytest
from httpx import AsyncClient
from tortoise import Tortoise
from config import TEST_DB_URI
from api.app import app
from api.models import Session, Player

MODELS = [Session, Player]


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
async def init_test_db():
    await Tortoise.init(
        db_url=TEST_DB_URI, modules={"models": ["api.models"]}, _create_db=True
    )
    await Tortoise.generate_schemas()
    yield
    await Tortoise._drop_databases()


@pytest.fixture
async def api_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
async def clear_db():
    yield
    for model in MODELS:
        await model.all().delete()
