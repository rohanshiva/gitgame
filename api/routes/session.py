from fastapi import APIRouter, Depends, status
from nanoid import generate
from db import Models
from deps import get_context

router = APIRouter(prefix="/session", tags=["Session"])


@router.post(
    "/make", status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_context)]
)
async def make():
    id = generate(size=10)
    session = await Models.Session.create(id=id)
    return {"id": session.id}
