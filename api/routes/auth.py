import logging
from httpx import AsyncClient
from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode, urlparse
from deps import get_gh_oauth_store
from config import (
    GITHUB_LOGIN_ENDPOINT,
    GITHUB_ACCESS_TOKEN_ENDPOINT,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    CLIENT_URL,
)
from services.github_client import (
    GithubClient,
    GithubUserNotFound,
    GithubUserLoadingError,
)
from services.github_oauth_store import GithubOauthStore, GithubOauthRecord
from services.auth import Auth
from uuid import uuid4

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger()


def build_protected_response(url: str, token: str):
    response = RedirectResponse(url)
    domain = urlparse(url).hostname
    response.set_cookie(key="token", value=token, httponly=True, domain=domain)
    return response


@router.get("/login", status_code=status.HTTP_307_TEMPORARY_REDIRECT)
async def login(
    referrer: str | None = None,
    oauth_store: GithubOauthStore = Depends(get_gh_oauth_store),
):
    oauth_state = str(uuid4())
    params = {"client_id": GITHUB_CLIENT_ID, "state": oauth_state}
    oauth_store.put(oauth_state, GithubOauthRecord(referrer=referrer))
    return RedirectResponse(f"{GITHUB_LOGIN_ENDPOINT}?{urlencode(params)}")


@router.get("/gh")
async def authenticate_gh_user(
    code: str, state: str, oauth_store: GithubOauthStore = Depends(get_gh_oauth_store)
):
    if not oauth_store.has(state):
        # The state doesn't exist on our end, so we will have the client retry the authentication process.
        # https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
        return RedirectResponse(CLIENT_URL)

    async with AsyncClient() as client:
        params = {
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
        }

        response = await client.post(
            GITHUB_ACCESS_TOKEN_ENDPOINT,
            json=params,
            headers={"Accept": "application/json"},
        )

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        json = response.json()

        if "error" in json and json["error"] == "bad_verification_code":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid code. Try again here '/auth/login' ",
            )

        access_token = json["access_token"]
        gh_client = GithubClient(access_token)

        try:
            user = await gh_client.get_user()
            username = user["username"]
            token = Auth.encode(username)
            oauth_record = oauth_store.get(state)
            oauth_store.delete(state)
            target = CLIENT_URL
            if oauth_record["referrer"] is not None:
                target = f"{CLIENT_URL}{oauth_record['referrer']}"
            return build_protected_response(target, token)
        except GithubUserNotFound:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account/User not found. Try again here `/auth/login`",
            )
        except GithubUserLoadingError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Something unexpected went wrong. Try again here `/auth/login`",
            )
