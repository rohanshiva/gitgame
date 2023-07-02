import logging
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from deps import get_context, get_gh_client
from services.github.client import GithubClient, GithubApiException

router = APIRouter(prefix="/misc")
LOGGER = logging.getLogger()


class Feedback(BaseModel):
    message: str


@router.post(
    "/feedback",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_context)],
)
async def create_feedback(
    feedback: Feedback,
    gh_client: GithubClient = Depends(get_gh_client),
    user_agent=Header(default="Unknown User Agent"),
):
    title = feedback.message[:60]
    if len(feedback.message) > 60:
        title = f"{title}..."
    body = f"User Agent: {user_agent}\n\n{feedback.message}"
    try:
        await gh_client.create_issue(title, body, ["feedback"])
    except GithubApiException as e:
        LOGGER.exception(e)
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Unable to create feedback at this time",
        )
