from fastapi import WebSocket, status
from starlette.websockets import WebSocketState
import anyio
import logging

LOGGER = logging.getLogger(__name__)


class Connection:
    def __init__(self, session_id: str, player_name: str, websocket: WebSocket):
        self.session_id = session_id
        self.player_name = player_name
        self.__websocket = websocket

    async def accept(self):
        await self.__websocket.accept()

    async def send(self, data: dict):
        if self.__websocket.client_state == WebSocketState.CONNECTED:
            await self.__websocket.send_json(data)
        else:
            LOGGER.warn(
                f"Sending {data} to closed connection ({self.player_name}, {self.session_id})"
            )

    async def close(
        self, code: int = status.WS_1000_NORMAL_CLOSURE, reason: str | None = None
    ):
        await self.__websocket.close(
            code=code,
            reason=reason,
        )

    async def recieve(self) -> dict:
        return await self.__websocket.receive_json()

    def __eq__(self, other: "Connection"):
        return (
            self.player_name == other.player_name
            and self.session_id == other.session_id
        )


class ConnectionManager:
    def __init__(self):
        self.__sessions: dict[str, list[Connection]] = {}

    def get_or_none(self, session_id: str, player_name: str) -> Connection | None:
        for connection in self.__sessions.get(session_id, []):
            if connection.player_name == player_name:
                return connection
        return None

    def add(self, connection: Connection):
        connections = self.__sessions.get(connection.session_id, [])
        connections.append(connection)
        self.__sessions[connection.session_id] = connections

    def remove(self, connection: Connection):
        if connection.session_id in self.__sessions:
            self.__sessions[connection.session_id].remove(connection)
            if len(self.__sessions[connection.session_id]) == 0:
                del self.__sessions[connection.session_id]
        else:
            LOGGER.warn(
                f"Removing connection {connection.player_name} from non-existant session {connection.session_id}"
            )

    async def broadcast(self, session_id: str, data: dict):
        if session_id in self.__sessions:
            async with anyio.create_task_group() as tg:
                for connection in self.__sessions[session_id]:
                    tg.start_soon(connection.send, data)
