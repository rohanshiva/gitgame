from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from gitgame.routes.session import db
from gitgame.dependency import get_github_instance
from gitgame.services import Player, SessionState, get_invalid_authors

socket_app = FastAPI()


async def error_and_close(websocket: WebSocket, error_msg: str):
    await websocket.send_json({"error": error_msg})
    await websocket.close()


@socket_app.websocket("/{session_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, username: str):
    await websocket.accept()
    player = Player(username, websocket)

    if get_invalid_authors(get_github_instance(), [username]):
        await error_and_close(
            websocket, f"The username {username} is an invalid Github username"
        )
        return

    if session_id not in db:
        await error_and_close(
            websocket,
            f"The session with code {session_id} does not exist",
        )
        return

    session = db[session_id]

    if session.get_state() == SessionState.OUT_OF_CHUNKS:
        await error_and_close(
            websocket,
            f"The session with code {session_id} is no longer active. We don't have any more code chunks for you to play with",
        )
        return

    if session.has_player(player):
        await error_and_close(
            websocket,
            f"The player with username '{username}' is already in the session",
        )
        return

    await session.connect(player)
    try:
        while True:
            data = await websocket.receive_json()
            await session.handle_client_event(player, data)

    except WebSocketDisconnect as e:
        await session.disconnect(player)
        if session.can_be_removed():
            del db[session_id]
