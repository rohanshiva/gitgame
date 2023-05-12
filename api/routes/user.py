import logging

from config import DISABLE_AUTH
from services.auth import Auth, Context
from fastapi import APIRouter, Depends, HTTPException, status
from .auth import build_protected_response
from deps.auth import get_context

router = APIRouter(prefix="/user", tags=["User"])
logger = logging.getLogger()


@router.get("/", status_code=status.HTTP_200_OK)
async def get_user(context: Context = Depends(get_context)):
    username = context["username"]
    return {"username": username}


"""
For local testing, only works with unique private windows. 
App must first run without auth: python main.py -d
"""


@router.get("/impersonate/{username}")
async def impersonate(username: str):
    if not DISABLE_AUTH:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Run app without auth to impersonate",
        )

    token = Auth.encode(username)
    return build_protected_response("http://127.0.0.1:3000/", token)