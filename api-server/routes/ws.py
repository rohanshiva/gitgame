from fastapi import FastAPI, WebSocket, WebSocketDisconnect

socket_app = FastAPI()


async def error_and_close(websocket: WebSocket, error_msg: str):
    await websocket.send_json({"error": error_msg})
    await websocket.close()


@socket_app.websocket("/{session_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, username: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            # todo: handle event
            await websocket.send_text(f"{data}")
    except WebSocketDisconnect as e:
        # todo: handle disconnect event
        pass
