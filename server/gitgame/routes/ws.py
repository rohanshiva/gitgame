from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
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
        if username not in session.get_players():
            await session.connect(player)
