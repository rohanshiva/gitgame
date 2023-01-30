from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from models import Session, File, Player, Comment as DBComment
from services.github_client import GithubClient
from models import (
    AlreadyConnectedPlayerError,
    PlayerNotInGithubError,
    OutOfFilesError,
    NoSelectedSourceCodeError,
)
from ws.connection_manager import Connection, ConnectionManager
from config import GITHUB_ACCESS_TOKEN
from enum import IntEnum
from uuid import uuid4, UUID
from pydantic import BaseModel
import logging
import json

LOGGER = logging.getLogger(__name__)

socket_app = FastAPI()


class WSRequestType(IntEnum):
    PICK_SOURCE_CODE = 1
    ADD_COMMENT = 2
    DELETE_COMMENT = 3


class WSResponseType(IntEnum):
    ALERT = 0
    ERROR = 1
    OUT_OF_FILES_TO_PICK = 2
    LOBBY = 3
    SOURCE_CODE = 4
    COMMENTS = 5


class WSErrorType(IntEnum):
    ALREADY_CONNECTED_PLAYER = 0
    PLAYER_NOT_IN_GITHUB = 1
    SESSION_NOT_FOUND = 2
    NOT_ALLOWED = 3


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
    author: str # username
    file_name: str
    file_visit_url: str
    file_extension: str



def get_gh_client():
    return GithubClient(GITHUB_ACCESS_TOKEN)


async def broadcast_lobby(session: Session, manager: ConnectionManager):
    lobby_players: list[dict] = []
    players = await session.players.all()
    for player in players:
        lobby_players.append(
            dict(
                profile_url=player.profile_url,
                username=player.username,
                is_connected=player.connection_state
                == Player.ConnectionState.CONNECTED,
                is_host=session.host == player.id,
            )
        )
    await manager.broadcast(
        session.id, {"message_type": WSResponseType.LOBBY, "players": lobby_players}
    )


async def broadcast_alert(session: Session, manager: ConnectionManager, alert: str):
    await manager.broadcast(
        session.id, {"message_type": WSResponseType.ALERT, "alert": alert}
    )


async def broadcast_source_code(session: Session, manager: ConnectionManager):
    source_code = await session.get_source_code()
    if source_code is not None:
        file = await File.get(id=source_code.file_id)
        player = await Player.get(id=file.author_id)
        code = Code(
            id=str(source_code.id),
            content=source_code.content,
            author=player.username,
            file_name=file.name,
            file_extension=file.extension,
            file_visit_url=file.visit_url
        )
        await manager.broadcast(
            session.id,
            {
                "message_type": WSResponseType.SOURCE_CODE,
                "code": code.dict()
            },
        )


async def broadcast_comments(session: Session, manager: ConnectionManager):
    source_code = await session.get_source_code()
    if source_code is not None:
        # not efficient from DB perspective, but when the time comes to optimize, that is when we will optimize
        db_comments = await source_code.comments.all()
        players = await session.players.all()
        id_to_player: dict[str, CommentAuthor] = {}
        for player in players:
            id_to_player[player.id] = CommentAuthor(username=player.username, profile_url=player.profile_url)
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
                    author=author
                ).dict()
            )
        await manager.broadcast(
            session.id,
            {"message_type": WSResponseType.COMMENTS, "comments": comments},
        )


@socket_app.websocket(
    "/{session_id}/{username}",
)
async def on_websocket_event(
    websocket: WebSocket,
    username: str,
    session_id: str,
    gh_client: GithubClient = Depends(get_gh_client),
):
    await websocket.accept()
    session = await Session.filter(id=session_id).first()
    connection = Connection(str(uuid4()), session_id, websocket)
    if session is None:
        await connection.close_with_error(
            {
                "message_type": WSResponseType.ERROR,
                "error_type": WSErrorType.SESSION_NOT_FOUND,
                "error": f"Session {session_id} not found",
            }
        )
        return

    manager = ConnectionManager.instance()
    manager.add_connection(connection)

    async def on_leave():
        LOGGER.info(f"{username} attempting to leave {session.id}")
        await session.leave(username)
        manager.remove_connection(connection)
        await broadcast_lobby(session, manager)
        await broadcast_alert(session, manager, f"{username} has left")
        LOGGER.info(f"{username} left {session.id}")

    async def on_join():
        try:
            LOGGER.info(f"{username} attempting to join {session.id}")
            await session.join(username, gh_client)
            # todo: look into batching the below different ws responses into 1 response
            # todo: don't broadcast source code and comments to everyone
            await broadcast_lobby(session, manager)
            await broadcast_alert(session, manager, f"{username} has joined")
            await broadcast_source_code(session, manager)
            await broadcast_comments(session, manager)
            LOGGER.info(f"{username} joined {session.id}")
        except AlreadyConnectedPlayerError as e:
            await connection.close_with_error(
                {
                    "message_type": WSResponseType.ERROR,
                    "error_type": WSErrorType.ALREADY_CONNECTED_PLAYER,
                    "error": f"Player {username} has already connected to session {session_id}",
                }
            )
            manager.remove_connection(connection)
            raise e
        except PlayerNotInGithubError as e:
            await connection.close_with_error(
                {
                    "message_type": WSResponseType.ERROR,
                    "error_type": WSErrorType.PLAYER_NOT_IN_GITHUB,
                    "error": f"Player's username {username} is not a valid Github username",
                }
            )
            manager.remove_connection(connection)
            raise e

        # todo: figure out how to ensure session is a consistent state when there are errors raised from broadcast_lobby and broadcast_alert

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
                    await broadcast_source_code(session, manager)
                except OutOfFilesError:
                    await manager.broadcast(
                        session_id,
                        {"message_type": WSResponseType.OUT_OF_FILES_TO_PICK},
                    )
            else:
                await connection.send(
                    {
                        "message_type": WSResponseType.ERROR,
                        "error_type": WSErrorType.NOT_ALLOWED,
                        "error": f"{username} cannot pick since they are not the host",
                    }
                )

    async def on_add_comment(add_comment_body: AddCommentBody):
        try:
            await session.add_comment(
                add_comment_body.content,
                add_comment_body.line_start,
                add_comment_body.line_end,
                add_comment_body.type,
                username,
            )
            await broadcast_comments(session, manager)
        except NoSelectedSourceCodeError:
            await connection.send(
                {
                    "message_type": WSResponseType.ERROR,
                    "error_type": WSErrorType.NOT_ALLOWED,
                    "error": f"{username} tried to make a comment when there doesn't exist any active source code",
                }
            )

    async def on_delete_comment(delete_comment_body: DeleteCommentBody):
        comment_id = delete_comment_body.comment_id
        comment = await DBComment.filter(id=comment_id).first()
        deletion_error = None
        if comment is None:
            deletion_error = (
                f"{username} attempted to delete non-existant comment {comment_id}"
            )

        if comment.author_id != session.get_player_id(username):
            deletion_error = f"{username} attempted to delete a comment authored by a different author {comment.author_id}"

        if deletion_error is None:
            await session.delete_comment(comment_id)
            await broadcast_comments(session, manager)
        else:
            LOGGER.info(deletion_error)
            await connection.send(
                {
                    "message_type": WSResponseType.ERROR,
                    "error_type": WSErrorType.NOT_ALLOWED,
                    "error": deletion_error,
                }
            )

    try:
        await on_join()
    except Exception as e:
        LOGGER.error(e)
        return

    try:
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
                LOGGER.warn(f"Invalid request body: {json.dumps(data, indent=2)}, exception: {str(e)}")
            except KeyError as e:
                LOGGER.warn(
                    f"Invalid request body: 'message_type' key missing from request"
                )
    except WebSocketDisconnect:
        await on_leave()
