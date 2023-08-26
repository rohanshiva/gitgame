from pathlib import PurePosixPath
from pydantic import BaseModel
from uuid import UUID
import db.models as Models


class Player(BaseModel):
    profile_url: str
    username: str
    is_connected: bool
    is_ready: bool


class Code(BaseModel):
    id: str
    content: str
    author: str
    file_name: str
    file_visit_url: str
    file_extension: str
    file_display_path: str


class CommentAuthor(BaseModel):
    username: str
    profile_url: str


class Comment(BaseModel):
    id: str
    content: str
    line_start: int
    line_end: int
    type: Models.Comment.Type
    author: CommentAuthor


async def get_players(session_id: str):
    db_players = await Models.Player.filter(session_id=session_id).all()
    return [
        Player(
            profile_url=db_player.profile_url,
            username=db_player.username,
            is_connected=db_player.is_connected,
            is_ready=db_player.is_ready,
        )
        for db_player in db_players
    ]


async def get_code(session_id: str):
    source_code = await Models.SourceCode.get(session_id=session_id)
    file = await Models.File.get(id=source_code.file_id)
    repo = await Models.Repository.get(id=file.repo_id)
    author = await Models.Player.get(id=file.author_id)
    return Code(
        id=str(source_code.id),
        content=source_code.content,
        author=author.username,
        file_name=file.name,
        file_extension=file.extension,
        file_visit_url=file.visit_url,
        file_display_path=str(PurePosixPath(repo.name, "...", file.name)),
    )


async def get_comment(comment_id: str):
    db_comment = await Models.Comment.get(id=UUID(comment_id))
    author = await Models.Player.get(id=db_comment.author_id)
    return Comment(
        id=str(db_comment.id),
        content=db_comment.content,
        line_start=db_comment.line_start,
        line_end=db_comment.line_end,
        type=db_comment.type,
        author=CommentAuthor(username=author.username, profile_url=author.profile_url),
    )


async def get_comments(session_id: str) -> list[Comment]:
    author_cache = {}

    async def get_comment_author(author_id: UUID):
        if author_id in author_cache:
            return author_cache[author_id]
        author = await Models.Player.get(id=author_id)
        author_cache[author_id] = CommentAuthor(
            username=author.username, profile_url=author.profile_url
        )
        return author_cache[author_id]

    comments = []
    source_code = await Models.SourceCode.get(session_id=session_id)
    for db_comment in await source_code.comments.all():
        author = await get_comment_author(db_comment.author_id)
        comments.append(
            Comment(
                id=str(db_comment.id),
                content=db_comment.content,
                line_start=db_comment.line_start,
                line_end=db_comment.line_end,
                type=db_comment.type,
                author=author,
            )
        )
    return comments
