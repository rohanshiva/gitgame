import pytest
from unittest.mock import Mock
from models import (
    Session,
    Player,
    File,
    Repository,
    SourceCode,
    AlreadyConnectedPlayerError,
    PlayerNotInGithubError,
    OutOfFilesError,
)
from services.github_client import GithubUserNotFound
from test.conftest import mock_gh_client, get_test_repos, get_test_files


async def get_player(player_username: str, session_id: str):
    session = await Session.filter(id=session_id).first()
    player = await session.players.filter(username=player_username).first()
    assert player is not None
    return player


async def assert_host(player_username: str, session_id: str):
    session = await Session.filter(id=session_id).first()
    assert session.host is not None
    player = await Player.filter(id=session.host).first()
    assert player.username == player_username


async def assert_player_is_connected(player_username: str, session_id: str):
    player: Player = await get_player(player_username, session_id)
    assert player.connection_state == Player.ConnectionState.CONNECTED


async def assert_player_is_disconnected(player_username: str, session_id: str):
    player: Player = await get_player(player_username, session_id)
    assert player.connection_state == Player.ConnectionState.DISCONNECTED


async def get_connected_player_count(session_id: str):
    session = await Session.filter(id=session_id).first()
    return await session.players.filter(
        connection_state=Player.ConnectionState.CONNECTED
    ).count()


@pytest.mark.usefixtures("clear_db")
class TestJoin:
    @pytest.mark.anyio
    async def test_multiple_players_joining(
        self, session: Session, noop_gh_client: Mock
    ):
        await session.join("Ramko9999", noop_gh_client)
        await assert_player_is_connected("Ramko9999", session.id)

        await session.join("TanushN", noop_gh_client)
        await assert_player_is_connected("TanushN", session.id)

        await assert_host("Ramko9999", session.id)
        assert await get_connected_player_count(session.id) == 2

    @pytest.mark.anyio
    async def test_joined_player_joining_again(
        self, session: Session, noop_gh_client: Mock
    ):
        await session.join("Ramko9999", noop_gh_client)
        await assert_player_is_connected("Ramko9999", session.id)

        try:
            await session.join(
                "Ramko9999", noop_gh_client
            )  # should raise AlreadyConnectedPlayerError
            assert False
        except AlreadyConnectedPlayerError:
            pass

        await assert_host("Ramko9999", session.id)

        assert await get_connected_player_count(session.id) == 1

    @pytest.mark.anyio
    async def test_player_with_invalid_gh_username_joining(self, session: Session):
        def user_to_repos(*args, **kwargs):
            raise GithubUserNotFound()

        def repo_to_files(*args, **kwargs):
            return []

        def file_to_content(*args, **kwargs):
            return ""

        gh_client = mock_gh_client(user_to_repos, repo_to_files, file_to_content)
        try:
            await session.join("Ramko9999", gh_client)
            assert False
        except PlayerNotInGithubError:
            pass

        await session.refresh_from_db()
        assert session.host is None

        assert await get_connected_player_count(session.id) == 0


@pytest.mark.usefixtures("clear_db")
class TestLeave:
    @pytest.mark.anyio
    async def test_player_leaving(self, session: Session, noop_gh_client: Mock):
        await session.join("Ramko9999", noop_gh_client)
        await session.join("TanushN", noop_gh_client)
        await session.leave("TanushN")

        await assert_host("Ramko9999", session.id)

        await assert_player_is_disconnected("TanushN", session.id)
        await get_connected_player_count(session.id) == 1

    @pytest.mark.anyio
    async def test_host_player_leaving(self, session: Session, noop_gh_client: Mock):
        await session.join("Ramko9999", noop_gh_client)

        await assert_host("Ramko9999", session.id)

        await session.join("TanushN", noop_gh_client)
        await session.leave("Ramko9999")

        await assert_host("TanushN", session.id)

        await assert_player_is_disconnected("Ramko9999", session.id)
        await get_connected_player_count(session.id) == 1


@pytest.mark.usefixtures("clear_db")
class TestPickSourceCode:
    @pytest.mark.anyio
    async def test_selection_with_no_available_files(
        self, session: Session, noop_gh_client: Mock
    ):
        await session.join("Ramko9999", noop_gh_client)

        try:
            await session.pick_source_code(noop_gh_client)
            assert False
        except OutOfFilesError:
            pass

    @pytest.mark.anyio
    async def test_selection_with_one_file(self, session: Session):
        def user_to_repos(username, *args, **kwargs):
            return get_test_repos(username), None

        def repo_to_files(repo, *args, **kwargs):
            return get_test_files(repo)

        def file_to_content(url, *args, **kwargs):
            return f"url={url}"

        gh_client = mock_gh_client(user_to_repos, repo_to_files, file_to_content)
        await session.join("Ramko9999", gh_client)

        total_file_count = await File.all().count()
        assert total_file_count == 1

        await session.pick_source_code(gh_client)
        source_code = await SourceCode.filter(session_id=session.id).first()
        assert source_code is not None

        try:
            await session.pick_source_code(gh_client)
            assert False
        except OutOfFilesError:
            pass

    @pytest.mark.anyio
    async def test_selection_with_multiple_files(self, session: Session):
        def user_to_repos(username, *args, **kwargs):
            return (
                get_test_repos(username, limit=Player.MAX_REPOS_TO_GENERATE_FILES * 2),
                None,
            )

        def repo_to_files(repo, *args, **kwargs):
            return get_test_files(repo)

        def file_to_content(url, *args, **kwargs):
            return f"url={url}"

        gh_client = mock_gh_client(user_to_repos, repo_to_files, file_to_content)
        await session.join("Ramko9999", gh_client)

        picked_files = set([])
        for _ in range(Player.MAX_REPOS_TO_GENERATE_FILES * 2):
            await session.pick_source_code(gh_client)
            source_code = await SourceCode.filter(session_id=session.id).first()
            assert source_code is not None
            file = await source_code.file
            assert file.id not in picked_files
            picked_files.add(file.id)

        assert gh_client.get_files_for_repo.call_count == 10
        loaded_repo_count = await Repository.filter(load_status=True).count()
        assert loaded_repo_count == 10
