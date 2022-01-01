from fastapi import WebSocket
from typing import Dict

class PlayerState:
    READY = "ready"
    NOT_READY = "not ready"
    IS_GUESSING = "is guessing"
    HAS_GUESSED = "has guessed"
    SPECTATING = "spectating"


class Player:
    def __init__(
        self, username: str, websocket: WebSocket, state: str = PlayerState.NOT_READY
    ):
        self.__username = username
        self.__websocket = websocket
        self.__state = state

    def get_username(self) -> str:
        return self.__username

    def get_websocket(self) -> WebSocket:
        return self.__websocket

    def get_state(self) -> PlayerState:
        return self.__state

    def set_state(self, state: str):
        self.__state = state

    def __str__(self) -> str:
        return f"{self.username}"

    def serialize(self) -> Dict:
        return {"username": self.__username, "state": self.__state}
    
    def __eq__(self, __o: object) -> bool:
        return type(__o) == Player and self.__username == __o.get_username()
