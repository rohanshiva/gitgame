import logging
from enum import Enum
from fastapi import APIRouter, status, Depends
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode, urlparse
from deps import get_gh_oauth
from config import (
    CLIENT_URL,
)
from services.github.client import GithubClient, GithubApiException
from services.github.oauth import GithubOauthRecord, GithubOauth
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
    gh_oauth: GithubOauth = Depends(get_gh_oauth),
):
    oauth_state = str(uuid4())
    gh_oauth.store.put(oauth_state, GithubOauthRecord(referrer=referrer))
    return RedirectResponse(gh_oauth.get_authorization_url(oauth_state))


@router.get("/gh")
async def authenticate_gh_user(
    state: str,
    code: str | None = None,
    error: str | None = None,
    gh_oauth: GithubOauth = Depends(get_gh_oauth),
):
    if not gh_oauth.store.has(state):
        LOGGER.error(f"Github OAuth state '{state}' doesn't exist in store")
        # Unexpected code branch. The state doesn't exist on our end, so we will have the client retry the authentication process.
        # https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
        return redirect_to_login(RedirectionToLoginReason.UNEXPECTED_AUTH_FAILURE)

    oauth_record = gh_oauth.store.pop(state)
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

    try:
        access_token = await gh_oauth.get_access_token(code)
        gh_client = GithubClient(access_token)
        user = await gh_client.get_user()
        token = Auth.encode(user["username"])
        return redirect_with_token(token, oauth_record["referrer"])
    except GithubApiException as e:
        LOGGER.exception(e)
        return redirect_to_login(
            RedirectionToLoginReason.UNEXPECTED_AUTH_FAILURE, oauth_record["referrer"]
        )
