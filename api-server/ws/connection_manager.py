from fastapi.websockets import WebSocket
import anyio


class Connection:
    def __init__(self, id: str, group: str, websocket: WebSocket):
        self.__id = id
        self.__group = group
        self.__websocket = websocket

    async def send(self, data: dict):
        await self.__websocket.send_json(data)

    def get_group(self):
        return self.__group

    async def close_with_error(self, error_data: dict):
        await self.send(error_data)
        await self.__websocket.close()

    def __eq__(self, other: "Connection"):
        return self.__id == other.__id and self.__group == other.__group


class ConnectionManager:
    __instance = None

    def __init__(self):
        self.__connection_groups: dict[str, list[Connection]] = {}

    def add_connection(self, connection: Connection):
        if connection.get_group() not in self.__connection_groups:
            self.__connection_groups[connection.get_group()] = []
        self.__connection_groups[connection.get_group()].append(connection)

    def remove_connection(self, connection: Connection):
        self.__connection_groups[connection.get_group()].remove(connection)
        if len(self.__connection_groups[connection.get_group()]) == 0:
            del self.__connection_groups[connection.get_group()]

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
