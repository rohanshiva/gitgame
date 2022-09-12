import logging
from fastapi import APIRouter, HTTPException, status
from nanoid import generate
from api.models import Session

router = APIRouter(prefix="/session", tags=["Session"])
logger = logging.getLogger()


@router.post("/make", status_code=status.HTTP_201_CREATED)
async def make_session():
    try:
        id = generate(size=10)
        session = Session(id=id, state=Session.State.CREATED)
        await session.save()
        return {"id": session.id}
    except Exception as e:
        logger.error("Unable to create session")
        return HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))
