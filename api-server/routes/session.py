import logging
import random
from fastapi import APIRouter, HTTPException, Depends, status
from nanoid import generate
from pydantic import BaseModel
from tortoise.transactions import in_transaction
from models import Session, Player
from services.github_client import GithubClient, GithubUserNotFound
from config import GITHUB_ACCESS_TOKEN

router = APIRouter(prefix="/session", tags=["Session"])
logger = logging.getLogger()


class LobbyPlayer(BaseModel):
    username: str
    connection_state: str
    is_host: bool


class Lobby(BaseModel):
    players: list[LobbyPlayer]


@router.post("/make", status_code=status.HTTP_201_CREATED)
async def make():
    try:
        id = generate(size=10)
        session = Session(id=id, state=Session.State.CREATED)
        await session.save()
        return {"id": session.id}
    except Exception as e:
        logger.error("Unable to create session")
        return HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))


class JoinRequestBody(BaseModel):
    username: str


async def get_lobby(session: Session) -> Lobby:
    lobby_players: list[LobbyPlayer] = []
    players = await session.players.all()
    for player in players:
        lobby_players.append(
            LobbyPlayer(
                username=player.username,
                connection_state=player.connection_state,
                is_host=session.host == player.id,
            )
        )
    return Lobby(players=lobby_players)


async def verify_session(session_id: str):
    session = await Session.get_or_none(id=session_id)
    if not session:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Session {session_id} not found"
        )


def get_gh_client():
    return GithubClient(GITHUB_ACCESS_TOKEN)


@router.post(
    "/join/{session_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=Lobby,
    dependencies=[Depends(verify_session)],
)
async def join(
    session_id: str,
    join_body: JoinRequestBody,
    gh_client: GithubClient = Depends(get_gh_client),
):
    # todo(ramko9999): select for update may prevent insertions of rows which reference session_id via Fkey. Consider passing in no_key
    # or using an other table just for locking lobby related activities such as joining, leaving or scoring the game.
    player_id = f"{session_id}-{join_body.username}"
    async with in_transaction():
        session = await Session.filter(id=session_id).select_for_update().first()
        player = await Player.get_or_none(id=player_id)
        if player and player.connection_state == Player.ConnectionState.CONNECTED:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"Player {join_body.username} has already connected to session {session_id}",
            )

        if player:
            player.connection_state = Player.ConnectionState.CONNECTED
            await player.save(update_fields=["connection_state"])
        else:
            player = Player(
                id=player_id,
                session_id=session_id,
                username=join_body.username,
                connection_state=Player.ConnectionState.CONNECTED,
            )
            await player.save()
            try:
                await player.load_repos(gh_client)
            except GithubUserNotFound:
                raise HTTPException(
                    status.HTTP_404_NOT_FOUND,
                    f"Player's username {join_body.username} is not a valid Github username",
                )
            await player.load_files(gh_client)

        if session.host is None:
            session.host = player.id
            await session.save(update_fields=["host"])
        return await get_lobby(session)


class LeaveRequestBody(BaseModel):
    username: str


@router.post(
    "/leave/{session_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=Lobby,
    dependencies=[Depends(verify_session)],
)
async def leave(session_id: str, leave_body: LeaveRequestBody):
    player_id = f"{session_id}-{leave_body.username}"
    async with in_transaction():
        session = await Session.filter(id=session_id).select_for_update().first()
        player = await Player.get_or_none(id=player_id)
        if not player or player.connection_state == Player.ConnectionState.DISCONNECTED:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"Player {leave_body.username} is not currently connected to session {session_id}",
            )

        player.connection_state = Player.ConnectionState.DISCONNECTED
        await player.save(update_fields=["connection_state"])
        if session.host == player_id:
            connected_players = await session.players.filter(
                connection_state=Player.ConnectionState.CONNECTED
            )
            # todo(ramko9999): How should we handle the clean up of a session and other rows referencing it in the DB if all players leave
            if len(connected_players) > 0:
                new_host = random.choice(connected_players)
                session.host = new_host.id
            else:
                session.host = None
            await session.save(update_fields=["host"])

        return await get_lobby(session)
