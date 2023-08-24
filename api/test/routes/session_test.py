import pytest
from httpx import AsyncClient, Cookies
from services.auth import Auth
from db import Models


@pytest.mark.usefixtures("clear_db")
class TestMakeSession:
    @pytest.mark.anyio
    async def test_make_session_with_context(self, api_client: AsyncClient):
        cookies = Cookies()
        username = "test_username"
        cookies.set("token", Auth.encode(username))
        api_client.cookies = cookies
        response = await api_client.post("/session/make")
        assert response.status_code == 201
        response_json = response.json()
        assert "id" in response_json
        session = await Models.Session.filter(id=response_json["id"]).first()
        assert session is not None
        assert session.host is None

    @pytest.mark.anyio
    async def test_make_session_without_context(self, api_client: AsyncClient):
        response = await api_client.post("/session/make")
        assert response.status_code == 401
