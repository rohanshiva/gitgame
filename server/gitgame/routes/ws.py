from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
from gitgame.routes.session import db
from gitgame.services import Player

socket_app = FastAPI()


@socket_app.websocket("/{session_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, username: str):
    if not session_id in db:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"session {session_id} doesn't exist"
        )
    session = db[session_id]
    player = Player(username, websocket)
    await session.connect(player)

    try:
        while True:
            data = await websocket.receive_json()
            await session.handle_client_event(player, data)

    except WebSocketDisconnect as e:
        await session.disconnect(player)

        """
        if session.can_be_removed():
            del db[session_id]
        """
