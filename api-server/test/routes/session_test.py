import pytest
import json
from httpx import AsyncClient
from models import Session, Player
from typing import TypedDict, Callable
from unittest.mock import Mock
from services.github_client import GithubUserNotFound


class LobbyPlayerDict(TypedDict):
    username: str
    is_host: bool
    connection_state: str


def assert_lobby(actual: list[LobbyPlayerDict], expected: list[LobbyPlayerDict]):
    assert len(actual) == len(expected)
    username_key = lambda player: player["username"]
    sorted_actual = list(sorted(actual, key=username_key))
    sorted_expected = list(sorted(expected, key=username_key))
    assert sorted_actual == sorted_expected


async def join_session(api_client: AsyncClient, session_id: str, username: str):
    return await api_client.post(
        f"/session/join/{session_id}",
        headers={"Content-Type": "application/json"},
        content=json.dumps({"username": username}),
    )


async def leave_session(api_client: AsyncClient, session_id: str, username: str):
    return await api_client.post(
        f"/session/leave/{session_id}",
        headers={"Content-Type": "application/json"},
        content=json.dumps({"username": username}),
    )


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


@pytest.mark.usefixtures("clear_db")
class TestJoinSession:
    @pytest.mark.anyio
    @pytest.mark.usefixtures("empty_gh_client")
    async def test_multiple_players_joining(self, api_client: AsyncClient):
        response = await api_client.post("/session/make")
        session_id = response.json()["id"]
        response = await join_session(api_client, session_id, "Ramko9999")

        assert response.status_code == 202
        expected_lobby = [
            LobbyPlayerDict(
                username="Ramko9999",
                is_host=True,
                connection_state=Player.ConnectionState.CONNECTED,
            )
        ]

        assert_lobby(response.json()["players"], expected_lobby)

        response = await join_session(api_client, session_id, "TanushN")

        expected_lobby = [
            LobbyPlayerDict(
                username="Ramko9999",
                is_host=True,
                connection_state=Player.ConnectionState.CONNECTED,
            ),
            LobbyPlayerDict(
                username="TanushN",
                is_host=False,
                connection_state=Player.ConnectionState.CONNECTED,
            ),
        ]

        assert_lobby(response.json()["players"], expected_lobby)

    @pytest.mark.anyio
    @pytest.mark.usefixtures("empty_gh_client")
    async def test_same_player_joining_multiple_times(self, api_client: AsyncClient):
        response = await api_client.post("/session/make")
        session_id = response.json()["id"]
        await join_session(api_client, session_id, "Ramko9999")
        response = await join_session(api_client, session_id, "Ramko9999")
        assert response.status_code == 422
        assert (
            response.json()["detail"]
            == f"Player Ramko9999 has already connected to session {session_id}"
        )

    @pytest.mark.anyio
    @pytest.mark.usefixtures("empty_gh_client")
    async def test_joining_non_existant_session(self, api_client: AsyncClient):
        session_id = "Non Existant Id"
        response = await join_session(api_client, session_id, "Ramko9999")

        assert response.status_code == 404
        assert response.json()["detail"] == f"Session {session_id} not found"
        assert await Player.all().count() == 0

    @pytest.mark.anyio
    async def test_player_with_invalid_gh_username_joining(
        self, api_client: AsyncClient, mock_gh_client_factory: Callable[..., Mock]
    ):
        def user_to_repos(*args, **kwargs):
            raise GithubUserNotFound()

        def repo_to_files(*args, **kwargs):
            return []

        mock_gh_client_factory(user_to_repos, repo_to_files)
        response = await api_client.post("/session/make")
        session_id = response.json()["id"]

        response = await join_session(api_client, session_id, "Ramko999")
        assert response.status_code == 404
        assert (
            response.json()["detail"]
            == f"Player's username Ramko999 is not a valid Github username"
        )


@pytest.mark.usefixtures("clear_db")
class TestLeaveSession:
    @pytest.mark.anyio
    @pytest.mark.usefixtures("empty_gh_client")
    async def test_non_host_player_reconnecting(self, api_client: AsyncClient):
        response = await api_client.post("/session/make")
        session_id = response.json()["id"]
        await join_session(api_client, session_id, "TanushN")
        await join_session(api_client, session_id, "Ramko9999")
        response = await leave_session(api_client, session_id, "Ramko9999")

        assert response.status_code == 202

        expected_lobby = [
            LobbyPlayerDict(
                username="TanushN",
                is_host=True,
                connection_state=Player.ConnectionState.CONNECTED,
            ),
            LobbyPlayerDict(
                username="Ramko9999",
                is_host=False,
                connection_state=Player.ConnectionState.DISCONNECTED,
            ),
        ]

        assert_lobby(response.json()["players"], expected_lobby)

        response = await join_session(api_client, session_id, "Ramko9999")
        assert response.status_code == 202

        expected_lobby = [
            LobbyPlayerDict(
                username="TanushN",
                is_host=True,
                connection_state=Player.ConnectionState.CONNECTED,
            ),
            LobbyPlayerDict(
                username="Ramko9999",
                is_host=False,
                connection_state=Player.ConnectionState.CONNECTED,
            ),
        ]

        assert_lobby(response.json()["players"], expected_lobby)

    @pytest.mark.anyio
    @pytest.mark.usefixtures("empty_gh_client")
    async def test_host_player_reconnecting(self, api_client: AsyncClient):
        response = await api_client.post("/session/make")
        session_id = response.json()["id"]
        await join_session(api_client, session_id, "TanushN")
        await join_session(api_client, session_id, "Ramko9999")

        response = await leave_session(api_client, session_id, "TanushN")
        assert response.status_code == 202

        expected_lobby = [
            LobbyPlayerDict(
                username="TanushN",
                is_host=False,
                connection_state=Player.ConnectionState.DISCONNECTED,
            ),
            LobbyPlayerDict(
                username="Ramko9999",
                is_host=True,
                connection_state=Player.ConnectionState.CONNECTED,
            ),
        ]

        assert_lobby(response.json()["players"], expected_lobby)
        response = await join_session(api_client, session_id, "TanushN")
        assert response.status_code == 202

        expected_lobby = [
            LobbyPlayerDict(
                username="TanushN",
                is_host=False,
                connection_state=Player.ConnectionState.CONNECTED,
            ),
            LobbyPlayerDict(
                username="Ramko9999",
                is_host=True,
                connection_state=Player.ConnectionState.CONNECTED,
            ),
        ]

        assert_lobby(response.json()["players"], expected_lobby)

    @pytest.mark.anyio
    @pytest.mark.usefixtures("empty_gh_client")
    async def test_leave_when_player_not_in_session(self, api_client: AsyncClient):
        response = await api_client.post("/session/make")
        session_id = response.json()["id"]

        response = await leave_session(api_client, session_id, "Ramko9999")
        assert response.status_code == 422
        assert (
            response.json()["detail"]
            == f"Player Ramko9999 is not currently connected to session {session_id}"
        )

        await join_session(api_client, session_id, "Ramko9999")
        response = await leave_session(api_client, session_id, "Ramko9999")
        assert response.status_code == 202
        assert response.json()["players"] == [
            LobbyPlayerDict(
                username="Ramko9999",
                is_host=False,
                connection_state=Player.ConnectionState.DISCONNECTED,
            )
        ]

        response = await leave_session(api_client, session_id, "Ramko9999")
        assert response.status_code == 422
        assert (
            response.json()["detail"]
            == f"Player Ramko9999 is not currently connected to session {session_id}"
        )

    @pytest.mark.anyio
    @pytest.mark.usefixtures("empty_gh_client")
    async def test_leave_when_session_is_non_existant(self, api_client: AsyncClient):
        session_id = "Non Existant Id"
        response = await leave_session(api_client, session_id, "Ramko9999")
        assert response.status_code == 404
        assert response.json()["detail"] == f"Session {session_id} not found"
