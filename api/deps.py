from config import GITHUB_ACCESS_TOKEN
from fastapi import Cookie, HTTPException, status
from services.auth import Auth
from services.github_client import GithubClient


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
