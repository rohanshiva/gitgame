from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
from gitgame.routes.session import db
from gitgame.dependency import validate_authors
from gitgame.services import Player

socket_app = FastAPI()


@socket_app.websocket("/{session_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, username: str):
    await websocket.accept()
    player = Player(username, websocket)
    if validate_authors([username]):
        await websocket.send_json({"error": f"invalid username: {username}"})
        await websocket.close()
    elif session_id not in db:
        await websocket.send_json({"error": f"invalid session_id: {session_id}"})
        await websocket.close()
    else:
        session = db[session_id]
        if username not in session.get_players():
            await session.connect(player)
