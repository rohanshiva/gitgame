import logging
from httpx import AsyncClient
from fastapi import APIRouter, status, HTTPException
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
from config import (
    GITHUB_LOGIN_ENDPOINT,
    GITHUB_ACCESS_TOKEN_ENDPOINT,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
)
from services.github_client import (
    GithubClient,
    GithubUserNotFound,
    GithubUserLoadingError,
)
from services.auth import Auth

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger()


def build_protected_response(url: str, token: str):
    response = RedirectResponse(url)
    # todo(rohan) : extract domain from url
    response.set_cookie(key="token", value=token, httponly=True, domain="127.0.0.1")
    return response


@router.get("/login", status_code=status.HTTP_307_TEMPORARY_REDIRECT)
async def login():
    params = {"client_id": GITHUB_CLIENT_ID}
    return RedirectResponse(f"{GITHUB_LOGIN_ENDPOINT}?{urlencode(params)}")


@router.get("/gh")
async def authenticate_gh_user(code: str):
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
            return build_protected_response("http://127.0.0.1:3000/", token)
        except GithubUserNotFound:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account/User not found. Try again here `/auth/login`",
            )
        except GithubUserLoadingError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Something happened. Try again here `/auth/login`",
            )
