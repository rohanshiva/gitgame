from typing import TypedDict
from httpx import AsyncClient
from fastapi import status
from urllib.parse import urlencode
from .client import GithubApiException


class GithubOauthRecord(TypedDict):
    referrer: str | None  # the client's initial path prior to the authentication


"""
An in-memory store for keep tracking of client and server state during Github OAuth
"""


class GithubOauthStore:
    def __init__(self):
        self.__store = {}

    def has(self, key: str):
        return key in self.__store

    def pop(self, key: str) -> GithubOauthRecord:
        record = self.__store[key]
        del self.__store[key]
        return record

    def put(self, key: str, record: GithubOauthRecord):
        self.__store[key] = record


class GithubOauth:
    def __init__(self, id: str, secret: str):
        self.__client_id = id
        self.__client_secret = secret
        self.store = GithubOauthStore()

    async def get_access_token(self, code: str) -> str:
        endpoint = f"https://github.com/login/oauth/access_token"
        async with AsyncClient() as client:
            payload = {
                "client_id": self.__client_id,
                "client_secret": self.__client_secret,
                "code": code,
            }
            response = await client.post(
                endpoint,
                json=payload,
                headers={"Accept": "application/json"},
            )
            if response.status_code != status.HTTP_200_OK or "error" in response.json():
                raise GithubApiException(
                    response.request.url, response.status_code, response.text
                )
            return response.json()["access_token"]

    def get_authorization_url(self, state: str):
        endpoint = "https://github.com/login/oauth/authorize"
        params = {"state": state, "client_id": self.__client_id}
        return f"{endpoint}?{urlencode(params)}"
