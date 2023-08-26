from config import GITHUB_ACCESS_TOKEN, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
from fastapi import Cookie, HTTPException, status, WebSocket, Depends
from functools import cache
from services import (
    Auth,
    Context,
    Connection,
    ConnectionManager,
    GithubClient,
    GithubOauth,
)


async def get_context(token: str | None = Cookie(default=None)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        context = Auth.decode(token)
        return context
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


def get_gh_client():
    return GithubClient(GITHUB_ACCESS_TOKEN)


@cache
def get_gh_oauth():
    return GithubOauth(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)


def get_connection(
    websocket: WebSocket, session_id: str, context: Context = Depends(get_context)
):
    return Connection(session_id, context["username"], websocket)


@cache
def get_connection_manager():
    return ConnectionManager()
