import logging
from services.auth import Context
from fastapi import APIRouter, Depends, status
from deps.auth import get_context

router = APIRouter(prefix="/user", tags=["User"])
logger = logging.getLogger()


@router.get("/", status_code=status.HTTP_200_OK)
async def get_user(context: Context = Depends(get_context)):
    username = context["username"]
    return {"username": username}
