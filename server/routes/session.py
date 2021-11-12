from fastapi import APIRouter, HTTPException, status
from typing import List, Dict
from dependency.injection import get_chunk_fetcher, get_file_fetcher
from services.session import Session
from nanoid import generate
import logging


router = APIRouter(prefix="/session", tags=["session"])
logger = logging.getLogger()

db: Dict[str, Session] = {}


@router.post("/make", status_code=status.HTTP_201_CREATED)
def make_session(users: List[str]):
    id = generate(size=10)
    session = Session(id, users, get_file_fetcher(), get_chunk_fetcher())
    try:
        session.setup()
        db[id] = session
    except Exception as e:
        logging.error("Failed to setup, reason %s", str(e))
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))

    return {"id": id}


@router.get("/{session_id}/pick", status_code=status.HTTP_200_OK)
def pick_chunk(session_id: str):
    if not session_id in db:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"session {session_id} doesn't exist"
        )
    session = db[session_id]
    if session.can_pick():
        session.pick()
        return session.get_chunk().get_content()
    else:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "ran out of files to pick"
        )


@router.get("/{session_id}/chunk", status_code=status.HTTP_200_OK)
def get_chunk(session_id: str):
    if not session_id in db:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"session {session_id} doesn't exist"
        )
    session = db[session_id]
    chunk = session.get_chunk()
    if not chunk:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "get_chunk() called on a session which may have never even picked a file",
        )
    return chunk.get_content()


@router.get("/{session_id}/peek", status_code=status.HTTP_200_OK)
def peek_on_chunk(session_id: str, direction: str = "above"):
    if not session_id in db:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"session {session_id} doesn't exist"
        )
    session = db[session_id]

    if session.can_peek():
        if direction == "above":
            session.peek_above()
            return session.get_chunk().get_content()
        elif direction == "below":
            session.peek_below()
            return session.get_chunk().get_content()
        else:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "direction query parameter can only be 'above' or 'below'",
            )
    else:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "unable to call peek"
        )


@router.get("/{session_id}", status_code=status.HTTP_200_OK)
def get_session(session_id: str):
    if not session_id in db:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"session {session_id} doesn't exist"
        )
    session = db[session_id]
    return {"id": session_id, "players": session.get_players()}
