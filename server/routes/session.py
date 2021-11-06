from fastapi import APIRouter

router = APIRouter(
    prefix="/session",
    tags=["session"]
)

@router.get("/{session_id}")
def get_session(session_id: str):
    return {"message": f"you wanted session {session_id}"}


