import logging
from fastapi import APIRouter, Depends, status
from nanoid import generate
from models import Session
from deps.auth import get_context

router = APIRouter(prefix="/session", tags=["Session"])
logger = logging.getLogger()


@router.post(
    "/make", status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_context)]
)
async def make():
    id = generate(size=10)
    session = await Session.create(id=id)
    return {"id": session.id}