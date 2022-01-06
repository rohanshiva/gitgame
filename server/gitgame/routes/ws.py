from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from gitgame.routes.session import db
from gitgame.dependency import get_github_instance
from gitgame.services import Player
from gitgame.services.validation import validate_authors

socket_app = FastAPI()


@socket_app.websocket("/{session_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, username: str):
    await websocket.accept()
    player = Player(username, websocket)
    if validate_authors(get_github_instance(), [username]):
        await websocket.send_json({"error": f"invalid username: {username}"})
        await websocket.close()
    elif session_id not in db:
        await websocket.send_json({"error": f"invalid session_id: {session_id}"})
        await websocket.close()
    else:
        session = db[session_id]
        if not session.has_player(player):
            await session.connect(player)
            try:
                while True:
                    data = await websocket.receive_json()
                    await session.handle_client_event(player, data)

            except WebSocketDisconnect as e:
                await session.disconnect(player)
                if session.can_be_removed():
                    del db[session_id]
        else:
            await websocket.send_json({"error": f"this account {username} is already in the session"})
            await websocket.close()
