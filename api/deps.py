from config import GITHUB_ACCESS_TOKEN, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
from fastapi import Cookie, HTTPException, status
from functools import cache
from services.auth import Auth
from services.github.client import GithubClient
from services.github.oauth import GithubOauth


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
