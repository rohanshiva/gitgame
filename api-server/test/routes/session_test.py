import pytest
from httpx import AsyncClient
from models import Session


@pytest.mark.usefixtures("clear_db")
class TestMakeSession:
    @pytest.mark.anyio
    async def test_make_session(self, api_client: AsyncClient):
        response = await api_client.post("/session/make")
        assert response.status_code == 201
        response_json = response.json()
        assert "id" in response_json
        session = await Session.filter(id=response_json["id"]).first()
        assert session is not None
        assert session.host is None
