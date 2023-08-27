from fastapi import FastAPI, WebSocketDisconnect, Depends
from services import Connection, ConnectionManager, GithubClient, GithubApiException
from deps import get_connection, get_connection_manager, get_gh_client
from enum import IntEnum
from pydantic import BaseModel
from metrics import instrument, WS_CONNECTIONS
from enum import Enum
from tortoise.exceptions import DoesNotExist
from db import Views, Models, Crud
from dataclasses import dataclass
import logging

LOGGER = logging.getLogger(__name__)

socket_app = FastAPI()


class WSAppStatusCodes(IntEnum):
    SWITCHING_CONNECTIONS = 4001
    SESSION_NOT_FOUND = 4002
    GITHUB_API_ERRORED = 4003
    NOT_ALLOWED = 4004


class WSRequestType(IntEnum):
    ADD_COMMENT = 1
    READY = 2
    WAIT = 3


@dataclass
class WSEventContext:
    session_id: str
    player_name: str
    connection: Connection
    connection_manager: ConnectionManager
    gh_client: GithubClient


class WSResponseType(IntEnum):
    ALERT = 0
    ERROR = 1
    GAME_FINISHED = 2
    LOBBY = 3
    SOURCE_CODE = 4
    COMMENTS = 5
    BATCH = 6
    NEW_COMMENT = 7


class AddCommentRequest(BaseModel):
    content: str
    line_start: int
    line_end: int
    type: Models.Comment.Type


class AlertType(IntEnum):
    NEGATIVE = 0
    POSITIVE = 1
    NEUTRAL = 2


class Alert(BaseModel):
    message: str
    type: AlertType


class LobbyResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.LOBBY
    players: list[Views.Player]


class AlertResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.ALERT
    alert: Alert


class CodeResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.SOURCE_CODE
    code: Views.Code


class CommentsResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.COMMENTS
    comments: list[Views.Comment]


class NewCommentResponse(BaseModel):
    message_type: WSResponseType = WSResponseType.NEW_COMMENT
    comment: Views.Comment


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


async def get_lobby(session_id: str):
    players = await Views.get_players(session_id)
    return LobbyResponse(players=players)


async def get_code(session_id: str):
    try:
        code = await Views.get_code(session_id)
        return CodeResponse(code=code)
    except DoesNotExist:
        return None


async def get_comments(session_id: str):
    try:
        comments = await Views.get_comments(session_id)
        return CommentsResponse(comments=comments)
    except DoesNotExist:
        return None


async def get_new_comment(new_comment_id: str):
    comment = await Views.get_comment(new_comment_id)
    return NewCommentResponse(comment=comment)


def get_alert(message: str, type: AlertType = AlertType.POSITIVE):
    alert = Alert(message=message, type=type)
    return AlertResponse(alert=alert)


async def broadcast(ctx: WSEventContext, *messages: Response):
    messages = list(filter(lambda m: m is not None, messages))
    if len(messages) > 0:
        await ctx.connection_manager.broadcast(
            ctx.session_id, BatchResponse(messages=messages).dict()
        )


@instrument
async def on_advance(ctx: WSEventContext):
    await broadcast(ctx, get_alert("Advancing...", type=AlertType.NEUTRAL))
    await Crud.advance(ctx.session_id, ctx.gh_client)
    lobby = await get_lobby(ctx.session_id)
    if await Crud.is_terminated(ctx.session_id):
        await broadcast(ctx, lobby, GameFinishedResponse())
    else:
        await broadcast(ctx, lobby, await get_code(ctx.session_id))


@instrument
async def on_leave(ctx: WSEventContext):
    await Crud.leave(ctx.session_id, ctx.player_name)
    ctx.connection_manager.remove(ctx.connection)
    await broadcast(
        ctx,
        await get_lobby(ctx.session_id),
        get_alert(f"{ctx.player_name} has left", type=AlertType.NEGATIVE),
    )
    if await Crud.is_ready_to_advance(ctx.session_id):
        await on_advance(ctx)


@instrument
async def on_join(ctx: WSEventContext):
    try:
        await Crud.join(ctx.session_id, ctx.player_name, ctx.gh_client)
    except GithubApiException as e:
        await ctx.connection.close(
            code=WSAppStatusCodes.GITHUB_API_ERRORED,
            reason=f"{ctx.player_name} is unable to join due to Github API errors",
        )
        raise e
    except Crud.PlayerRejoiningError:
        other_connection = ctx.connection_manager.get_or_none(
            ctx.session_id, ctx.player_name
        )
        if other_connection is not None:
            ctx.connection_manager.remove(other_connection)
            # calling .close on a websocket in a different event loop raises a WebSocketDisconnect error in that websocket's event loop
            await other_connection.close(
                code=WSAppStatusCodes.SWITCHING_CONNECTIONS,
                reason="You connected elsewhere. Refresh to connect at this location.",
            )

    ctx.connection_manager.add(ctx.connection)
    lobby = await get_lobby(ctx.session_id)
    alert = get_alert(f"{ctx.player_name} has joined")
    if await Crud.is_terminated(ctx.session_id):
        await broadcast(ctx, lobby, alert, GameFinishedResponse())
    else:
        await broadcast(ctx, lobby, alert, await get_code(ctx.session_id), await get_comments(ctx.session_id))


@instrument
async def on_add_comment(ctx: WSEventContext, add_comment: AddCommentRequest):
    try:
        comment_id = await Crud.add_comment(
            ctx.session_id,
            add_comment.content,
            add_comment.line_start,
            add_comment.line_end,
            add_comment.type,
            ctx.player_name,
        )

        await broadcast(
            ctx,
            await get_comments(ctx.session_id),
            await get_new_comment(comment_id),
        )
    except Crud.NoSelectedCodeError:
        raise WSAppPolicyViolation(
            code=WSAppStatusCodes.NOT_ALLOWED,
            reason=f"{ctx.player_name} tried to make a comment when there doesn't exist any active source code",
        )


@instrument
async def on_ready(ctx: WSEventContext):
    await Crud.ready_up(ctx.session_id, ctx.player_name)
    await broadcast(ctx, await get_lobby(ctx.session_id))
    if await Crud.is_ready_to_advance(ctx.session_id):
        await on_advance(ctx)


@instrument
async def on_wait(ctx: WSEventContext):
    await Crud.wait(ctx.session_id, ctx.player_name)
    await broadcast(ctx, await get_lobby(ctx.session_id))


@socket_app.websocket("/{session_id}")
async def on_websocket_event(
    connection: Connection = Depends(get_connection),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
    gh_client: GithubClient = Depends(get_gh_client),
):
    await connection.accept()
    if not await Models.Session.exists(id=connection.session_id):
        await connection.close(
            code=WSAppStatusCodes.SESSION_NOT_FOUND,
            reason=f"Session {connection.session_id} not found",
        )
        return

    ctx = WSEventContext(
        session_id=connection.session_id,
        player_name=connection.player_name,
        connection=connection,
        connection_manager=connection_manager,
        gh_client=gh_client,
    )

    try:
        await on_join(ctx)
    except Exception as e:
        LOGGER.exception(e)
        return

    try:
        WS_CONNECTIONS.inc()
        while True:
            try:
                data = await connection.recieve()
                request_type = WSRequestType(int(data["message_type"]))
                if request_type == WSRequestType.ADD_COMMENT:
                    await on_add_comment(ctx, AddCommentRequest(**data))
                elif request_type == WSRequestType.READY:
                    await on_ready(ctx)
                else:
                    await on_wait(ctx)
            except ValueError as e:
                LOGGER.warn(f"Invalid request body: {data}, exception: {str(e)}")
            except KeyError as e:
                LOGGER.warn(
                    f"Invalid request body: 'message_type' key missing from request"
                )
    except WebSocketDisconnect as e:
        LOGGER.info(f"Client disconnection: {e.code} {e.reason}")
        if e.code != WSAppStatusCodes.SWITCHING_CONNECTIONS:
            await on_leave(ctx)
        WS_CONNECTIONS.dec()
    except WSAppPolicyViolation as e:
        # Calling websocket.close in the same event loop does not seem to throw a WebSocketDisconnect error
        # Hence this custom exception was created
        LOGGER.info(f"Server disconnection: {e.code} {e.reason}")
        await connection.close(code=e.code, reason=e.reason)
        await on_leave(ctx)
        WS_CONNECTIONS.dec()
