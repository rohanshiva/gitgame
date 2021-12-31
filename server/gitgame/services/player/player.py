from fastapi import WebSocket


class Player:
    def __init__(self, username: str, websocket: WebSocket):
        self.username = username
        self.websocket = websocket

    def get_username(self) -> str:
        return self.username

    def get_websocket(self) -> WebSocket:
        return self.websocket

    def __str__(self) -> str:
        return f"{self.username}"
