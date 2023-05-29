from fastapi import status
from fastapi.websockets import WebSocket
from starlette.websockets import WebSocketState
import anyio
import logging

LOGGER = logging.getLogger(__name__)


class Connection:
    def __init__(self, id: str, group: str, websocket: WebSocket):
        self.__id = id
        self.__group = group
        self.__websocket = websocket

    async def accept(self):
        await self.__websocket.accept()

    async def send(self, data: dict):
        if self.__websocket.client_state == WebSocketState.CONNECTED:
            await self.__websocket.send_json(data)
        else:
            LOGGER.warn(
                f"Attemping to send {data} to disconnected connection {self.__id} for group {self.__group}"
            )

    @property
    def group(self):
        return self.__group

    @property
    def id(self):
        return self.__id

    async def close(
        self, code: int = status.WS_1000_NORMAL_CLOSURE, reason: str | None = None
    ):
        await self.__websocket.close(
            code=code,
            reason=reason,
        )

    def __eq__(self, other: "Connection"):
        return self.__id == other.__id and self.__group == other.__group


class ConnectionManager:
    __instance = None

    def __init__(self):
        self.__connection_groups: dict[str, list[Connection]] = {}

    def get_connection(self, connection_id: str, group: str) -> Connection | None:
        if group in self.__connection_groups:
            connections = self.__connection_groups[group]
            for connection in connections:
                if connection.id == connection_id:
                    return connection
        return None

    def add_connection(self, connection: Connection):
        if connection.group not in self.__connection_groups:
            self.__connection_groups[connection.group] = []
        self.__connection_groups[connection.group].append(connection)

    def remove_connection(self, connection: Connection):
        if connection.group in self.__connection_groups:
            self.__connection_groups[connection.group].remove(connection)
            if len(self.__connection_groups[connection.group]) == 0:
                del self.__connection_groups[connection.group]
        else:
            LOGGER.warn(
                f"{connection.id} for {connection.group} is being removed even when the group doesn't exist in the manager"
            )

    async def broadcast(self, group: str, data: dict):
        if group in self.__connection_groups:
            async with anyio.create_task_group() as tg:
                for connection in self.__connection_groups[group]:
                    tg.start_soon(connection.send, data)

    @classmethod
    def instance(cls):
        if cls.__instance is None:
            cls.__instance = cls()
        return cls.__instance
