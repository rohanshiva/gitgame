import logging
from enum import Enum
from httpx import AsyncClient
from fastapi import APIRouter, status, Depends
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


class GithubOauthError(str, Enum):
    ACCESS_DENIED = "access_denied"


class RedirectionToLoginReason(int, Enum):
    UNEXPECTED_AUTH_FAILURE = 0
    USER_DENIED_GITHUB_AUTH = 1
    COOKIE_EXPIRATION = 2


router = APIRouter(prefix="/auth", tags=["Auth"])
LOGGER = logging.getLogger()


def redirect_with_token(token: str, referrer: str | None = None):
    url = CLIENT_URL
    if referrer is not None:
        url = f"{CLIENT_URL}{referrer}"
    response = RedirectResponse(url)
    domain = urlparse(url).hostname
    response.set_cookie(key="token", value=token, httponly=True, domain=domain)
    return response


def redirect_to_login(reason: RedirectionToLoginReason, referrer: str | None = None):
    # CLIENT_URL is assumed to be the login url as well
    params = {"redirection_reason": int(reason)}
    if referrer:
        params["referrer"] = referrer
    return RedirectResponse(f"{CLIENT_URL}?{urlencode(params)}")


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
    state: str,
    code: str | None = None,
    error: str | None = None,
    oauth_store: GithubOauthStore = Depends(get_gh_oauth_store),
):
    if not oauth_store.has(state):
        # Unexpected code branch. The state doesn't exist on our end, so we will have the client retry the authentication process.
        # https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
        return redirect_to_login(RedirectionToLoginReason.UNEXPECTED_AUTH_FAILURE)

    oauth_record = oauth_store.pop(state)
    if error is not None:
        if GithubOauthError.ACCESS_DENIED == error:
            return redirect_to_login(
                RedirectionToLoginReason.USER_DENIED_GITHUB_AUTH,
                oauth_record["referrer"],
            )
        else:
            # todo: track metrics around auth fails
            LOGGER.error(
                f"Github OAuth triggered redirect with an unexpected error: {error}"
            )
            return redirect_to_login(
                RedirectionToLoginReason.UNEXPECTED_AUTH_FAILURE,
                oauth_record["referrer"],
            )

    async with AsyncClient() as client:
        payload = {
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
        }

        response = await client.post(
            GITHUB_ACCESS_TOKEN_ENDPOINT,
            json=payload,
            headers={"Accept": "application/json"},
        )

        if response.status_code != status.HTTP_200_OK or "error" in response.json():
            LOGGER.error(
                f"Github Access Token Endpoint resulted in an error (status = {response.status_code}): {response.text}"
            )
            return redirect_to_login(
                RedirectionToLoginReason.UNEXPECTED_AUTH_FAILURE,
                oauth_record["referrer"],
            )

        access_token = response.json()["access_token"]
        gh_client = GithubClient(access_token)

        try:
            user = await gh_client.get_user()
            username = user["username"]
            token = Auth.encode(username)
            return redirect_with_token(token, oauth_record["referrer"])
        except GithubUserNotFound | GithubUserLoadingError:
            LOGGER.error("Github API failed to retrieve the user")
            return redirect_to_login(
                RedirectionToLoginReason.UNEXPECTED_AUTH_FAILURE,
                oauth_record["referrer"],
            )
