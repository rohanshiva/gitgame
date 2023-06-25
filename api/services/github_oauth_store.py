from typing import TypedDict


class GithubOauthRecord(TypedDict):
    referrer: str | None  # the client's initial path prior to the authentication


"""
An in-memory store for keep tracking of client and server state during Github OAuth
"""


class GithubOauthStore:
    __instance = None

    def __init__(self):
        self.__store = {}

    def has(self, key: str):
        return key in self.__store

    def get(self, key: str) -> GithubOauthRecord:
        return self.__store[key]

    def put(self, key: str, record: GithubOauthRecord):
        self.__store[key] = record

    def delete(self, key: str):
        del self.__store[key]

    @classmethod
    def instance(cls):
        if not cls.__instance:
            cls.__instance = cls()
        return cls.__instance
