from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from models import Session, File, Repository, Player as DBPlayer, Comment as DBComment
from services.github_client import GithubClient
from models import (
    AlreadyConnectedPlayerError,
    OutOfFilesError,
    NoSelectedSourceCodeError,
)
from services.auth import Context
from services.github_client import GithubApiException
from deps import get_context, get_gh_client
from ws.connection_manager import Connection, ConnectionManager
from enum import IntEnum
from uuid import UUID
from pydantic import BaseModel
from pathlib import PurePosixPath
from metrics import instrument, WS_CONNECTIONS


import logging

LOGGER = logging.getLogger(__name__)

socket_app = FastAPI()


class WSAppStatusCodes(IntEnum):
    SWITCHING_CONNECTIONS = 4001
    SESSION_NOT_FOUND = 4002
    PLAYER_NOT_IN_GITHUB = 4003
    NOT_ALLOWED = 4004


class WSRequestType(IntEnum):
    PICK_SOURCE_CODE = 1
    ADD_COMMENT = 2
    DELETE_COMMENT = 3


class WSResponseType(IntEnum):
    ALERT = 0
    ERROR = 1
    GAME_FINISHED = 2
    LOBBY = 3
    SOURCE_CODE = 4
    COMMENTS = 5
    BATCH = 6
    NEW_COMMENT = 7


class AddCommentBody(BaseModel):
    content: str
    line_start: int
    line_end: int
    type: DBComment.Type


class DeleteCommentBody(BaseModel):
    comment_id: UUID


class CommentAuthor(BaseModel):
    username: str
    profile_url: str


class Comment(BaseModel):
    id: str
    content: str
    line_start: int
    line_end: int
    type: DBComment.Type
    author: CommentAuthor


class Code(BaseModel):
    id: str
    content: str
    author: str  # username
    file_name: str
    file_visit_url: str
    file_extension: str
    file_display_path: str


class Player(BaseModel):
    profile_url: str
    username: str
    is_connected: bool
    is_host: bool


class LobbyResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.LOBBY
    players: list[Player]


class AlertResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.ALERT
    alert: str


class CodeResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.SOURCE_CODE
    code: Code


class CommentsResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.COMMENTS
    comments: list[Comment]


class NewCommentResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.NEW_COMMENT
    comment: Comment


class GameFinishedResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.GAME_FINISHED


Response = (
    LobbyResponse
    | AlertResponse
    | CodeResponse
    | CommentsResponse
    | NewCommentResponse
    | GameFinishedResponse
    | None
)


class BatchResponse(BaseModel):
    message_type: WSRequestType = WSResponseType.BATCH
    messages: list[Response]


class WSAppPolicyViolation(Exception):
    def __init__(self, code: int, reason: str = ""):
        self.code = code
        self.reason = reason


async def get_lobby(session: Session):
    lobby_players: list[Player] = []
    players = await session.players.all()
    for player in players:
        lobby_players.append(
            Player(
                profile_url=player.profile_url,
                username=player.username,
                is_connected=player.connection_state
                == DBPlayer.ConnectionState.CONNECTED,
                is_host=session.host == player.id,
            )
        )
    return LobbyResponse(players=lobby_players)


def get_alert(alert: str):
    return AlertResponse(alert=alert)


async def get_source_code(session: Session):
    source_code = await session.get_source_code()
    if source_code is None:
        return None
    file = await File.get(id=source_code.file_id)
    repo = await Repository.get(id=file.repo_id)
    player = await DBPlayer.get(id=file.author_id)
    code = Code(
        id=str(source_code.id),
        content=source_code.content,
        author=player.username,
        file_name=file.name,
        file_extension=file.extension,
        file_visit_url=file.visit_url,
        file_display_path=str(PurePosixPath(repo.name, "...", file.name)),
    )
    return CodeResponse(code=code)


async def get_comments(session: Session):
    source_code = await session.get_source_code()
    if source_code is None:
        return None
    # not efficient from DB perspective, but when the time comes to optimize, that is when we will optimize
    db_comments = await source_code.comments.all()
    players = await session.players.all()
    id_to_player: dict[str, CommentAuthor] = {}
    for player in players:
        id_to_player[player.id] = CommentAuthor(
            username=player.username, profile_url=player.profile_url
        )
    comments = []
    for db_comment in db_comments:
        author = id_to_player[db_comment.author_id]
        comments.append(
            Comment(
                id=str(db_comment.id),
                content=db_comment.content,
                line_start=db_comment.line_start,
                line_end=db_comment.line_end,
                type=db_comment.type,
                author=author,
            ).dict()
        )

    return CommentsResponse(comments=comments)


def get_batch(*messages: Response):
    batch_messages = []
    for message in messages:
        if message is not None:
            batch_messages.append(message)
    return BatchResponse(messages=batch_messages)


@socket_app.websocket("/{session_id}")
async def on_websocket_event(
    websocket: WebSocket,
    session_id: str,
    context: Context = Depends(get_context),
    gh_client: GithubClient = Depends(get_gh_client),
):
    username = context["username"]
    connection = Connection(username, session_id, websocket)
    await connection.accept()
    session = await Session.filter(id=session_id).first()
    if session is None:
        await connection.close(
            code=WSAppStatusCodes.SESSION_NOT_FOUND,
            reason=f"Session {session_id} not found",
        )
        return

    manager = ConnectionManager.instance()

    @instrument
    async def on_leave():
        await session.leave(username)
        manager.remove_connection(connection)
        lobby = await get_lobby(session)
        alert = get_alert(f"{username} has left")
        await manager.broadcast(session.id, get_batch(lobby, alert).dict())

    @instrument
    async def on_join():
        try:
            await session.join(username, gh_client)
        except GithubApiException as e:
            await connection.close(
                code=WSAppStatusCodes.PLAYER_NOT_IN_GITHUB,
                reason=f"{username} can't join due to Github API erroring",
            )
            raise e
        except AlreadyConnectedPlayerError:
            other_connection = manager.get_connection(username, session_id)
            if other_connection is not None:
                manager.remove_connection(other_connection)
                # calling .close on a websocket in a different event loop raises a WebSocketDisconnect error in that websocket's event loop
                await other_connection.close(
                    code=WSAppStatusCodes.SWITCHING_CONNECTIONS,
                    reason="You connected elsewhere. Refresh to connect at this location.",
                )

        manager.add_connection(connection)
        # todo: don't broadcast source code and comments to everyone
        lobby = await get_lobby(session)
        alert = get_alert(f"{username} has joined")
        source_code = await get_source_code(session)
        comments = await get_comments(session)
        await manager.broadcast(
            session.id, get_batch(lobby, alert, source_code, comments).dict()
        )
        # todo: figure out how to ensure session is a consistent state when there are errors raised from broadcast_lobby and broadcast_alert

    @instrument
    async def on_pick():
        await session.refresh_from_db()
        if session.host is not None:
            acting_player = session.get_player_id(username)
            LOGGER.info(
                f"{acting_player} attempting to pick while host is: {session.host} for {session.id}"
            )
            if session.host == acting_player:
                try:
                    await session.pick_source_code(gh_client)
                    source_code = await get_source_code(session)
                    await manager.broadcast(session.id, source_code.dict())
                except OutOfFilesError:
                    await manager.broadcast(session_id, GameFinishedResponse().dict())
            else:
                raise WSAppPolicyViolation(
                    code=WSAppStatusCodes.NOT_ALLOWED,
                    reason=f"{username} cannot pick since they are not host",
                )

    @instrument
    async def on_add_comment(add_comment_body: AddCommentBody):
        try:
            db_comment = await session.add_comment(
                add_comment_body.content,
                add_comment_body.line_start,
                add_comment_body.line_end,
                add_comment_body.type,
                username,
            )
            comments_resp = await get_comments(session)
            comment = list(
                filter(
                    lambda comment: comment.id == str(db_comment.id),
                    comments_resp.comments,
                )
            )[0]
            await manager.broadcast(
                session.id,
                get_batch(comments_resp, NewCommentResponse(comment=comment)).dict(),
            )
        except NoSelectedSourceCodeError:
            raise WSAppPolicyViolation(
                code=WSAppStatusCodes.NOT_ALLOWED,
                reason=f"{username} tried to make a comment when there doesn't exist any active source code",
            )

    # todo(Ramko9999): deletion is not supported atm
    async def on_delete_comment(delete_comment_body: DeleteCommentBody):
        comment_id = delete_comment_body.comment_id
        comment = await DBComment.filter(id=comment_id).first()
        deletion_error = None
        if comment is None:
            deletion_error = (
                f"{username} attempted to delete non-existant comment {comment_id}"
            )

        if comment.author_id != session.get_player_id(username):
            deletion_error = (
                f"{username} attempted to delete a comment not authored by them"
            )

        if deletion_error is None:
            await session.delete_comment(comment_id)
            comments = await get_comments(session)
            await manager.broadcast(session.id, comments.dict())
        else:
            raise WSAppPolicyViolation(
                code=WSAppStatusCodes.NOT_ALLOWED, reason=deletion_error
            )

    try:
        await on_join()
    except Exception as e:
        LOGGER.exception(e)
        return

    try:
        WS_CONNECTIONS.inc()
        while True:
            try:
                data = await websocket.receive_json()
                request_message_type = WSRequestType(int(data["message_type"]))
                if request_message_type == WSRequestType.PICK_SOURCE_CODE:
                    await on_pick()
                elif request_message_type == WSRequestType.ADD_COMMENT:
                    add_comment_body = AddCommentBody(**data)
                    await on_add_comment(add_comment_body)
                else:
                    delete_comment_body = DeleteCommentBody(**data)
                    await on_delete_comment(delete_comment_body)
            except ValueError as e:
                LOGGER.warn(f"Invalid request body: {data}, exception: {str(e)}")
            except KeyError as e:
                LOGGER.warn(
                    f"Invalid request body: 'message_type' key missing from request"
                )
    except WebSocketDisconnect as e:
        LOGGER.info(f"Client disconnection: {e.code} {e.reason}")
        if e.code != WSAppStatusCodes.SWITCHING_CONNECTIONS:
            await on_leave()
        WS_CONNECTIONS.dec()
    except WSAppPolicyViolation as e:
        # Calling websocket.close in the same event loop which processes the websocket does not seem to throw a WebSocketDisconnect error
        # Hence this custom exception was created
        LOGGER.info(f"Server disconnection: {e.code} {e.reason}")
        await connection.close(code=e.code, reason=e.reason)
        await on_leave()
        WS_CONNECTIONS.dec()
