import logging
import random
from contextlib import asynccontextmanager
from tortoise.functions import Count
from tortoise.transactions import in_transaction
from services.github.client import GithubClient, GithubApiException
from .models import Session, Player, SourceCode, File, Repository, Comment
from uuid import UUID

LOGGER = logging.getLogger()


class DBCrudException(Exception):
    pass


class PlayerRejoiningError(DBCrudException):
    pass


class NoSelectedCodeError(DBCrudException):
    pass


@asynccontextmanager
async def __session_lock(session_id: str) -> Session:
    async with in_transaction():
        session = await Session.get(id=session_id)
        await session.select_for_update()
        yield session
        session.version += 1
        await session.save(update_fields=["version"])
        return


async def __load_repos(author_id: UUID, gh_client: GithubClient):
    author = await Player.get(id=author_id)
    repo_dicts, _ = await gh_client.get_non_forked_repos(author.username)
    repos = []
    for repo_dict in repo_dicts:
        repos.append(
            Repository(
                **repo_dict,
                author_id=author.id,
            )
        )

    await Repository.bulk_create(repos)


REPO_LOAD_BATCH_SIZE = 5
SUPPORTED_LANGUAGE_EXTENSIONS = [
    "py",
    "js",
    "ts",
    "jsx",
    "tsx",
    "go",
    "dart",
    "java",
    "cc",
    "cpp",
    "c",
    "swift",
]


async def __load_files(session_id: str, author_id: UUID, gh_client: GithubClient):
    async with in_transaction():
        repos = await Repository.filter(author_id=author_id, is_loaded=False).order_by(
            "last_pushed_at"
        )
        non_empty_repos = 0
        loaded_repos = []
        files = []
        for repo in repos:
            if non_empty_repos == REPO_LOAD_BATCH_SIZE:
                break
            try:
                file_dicts = await gh_client.get_files_for_repo(
                    repo.name, repo.default_branch, SUPPORTED_LANGUAGE_EXTENSIONS
                )
                for file_dict in file_dicts:
                    files.append(
                        File(
                            **file_dict,
                            repo_id=repo.id,
                            author_id=author_id,
                            session_id=session_id,
                        )
                    )
                if len(file_dicts) > 0:
                    non_empty_repos += 1
            except GithubApiException as e:
                LOGGER.exception(e)
            finally:
                loaded_repos.append(repo.id)

        await Repository.filter(id__in=loaded_repos).update(is_loaded=True)
        await File.bulk_create(files)


async def __has_files_to_pick(session_id: str):
    return await File.filter(session_id=session_id).count() > 0


async def __pick_next_file_for_code(session_id: str):
    authors = (
        await File.filter(session_id=session_id)
        .annotate(count=Count("id"))
        .group_by("author_id")
        .values_list("author_id")
    )
    author_id: str = random.choice(authors)[0]
    repos = (
        await File.filter(author_id=author_id)
        .annotate(count=Count("id"))
        .group_by("repo_id")
        .values_list("repo_id")
    )
    repo_id: str = random.choice(repos)[0]
    files = await File.filter(author_id=author_id, repo_id=repo_id).all()
    return random.choice(files)


async def __remove_current_code(session_id: str):
    code = await SourceCode.get_or_none(session_id=session_id)
    if code is not None:
        await code.file.delete()


async def join(session_id: str, player_name: str, gh_client: GithubClient):
    async with __session_lock(session_id):
        player = await Player.get_or_none(username=player_name, session_id=session_id)
        if player is not None:
            if player.is_connected:
                raise PlayerRejoiningError()
            else:
                player.is_connected = True
                player.is_ready = False
                await player.save(update_fields=["is_connected", "is_ready"])
        else:
            player = await Player.create(session_id=session_id, username=player_name)
            await __load_repos(player.id, gh_client)
            await __load_files(session_id, player.id, gh_client)


async def leave(session_id: str, player_name: str):
    async with __session_lock(session_id):
        player = await Player.get_or_none(username=player_name, session_id=session_id)
        if player is not None and player.is_connected:
            player.is_connected = False
            await player.save(update_fields=["is_connected"])


async def advance(session_id: str, gh_client: GithubClient):
    async with in_transaction():
        await Player.filter(session_id=session_id, is_connected=True).update(
            is_ready=False
        )
        await __remove_current_code(session_id)
        is_file_pool_empty = not (await __has_files_to_pick(session_id))
        if is_file_pool_empty:
            await Session.filter(id=session_id).update(is_terminated=True)
            return

        file = await __pick_next_file_for_code(session_id)
        # download and persist the code to the DB
        content = await gh_client.download_file_from_url(file.download_url)
        LOGGER.info(f"Picked {file.name} for {session_id} from author {file.author_id}")
        await SourceCode.create(content=content, session_id=session_id, file=file)
        files_remaining_in_pool = await File.filter(author_id=file.author_id).count()
        if files_remaining_in_pool == 1:
            await __load_files(session_id, file.author_id, gh_client)


async def add_comment(
    session_id: str,
    content: str,
    line_start: int,
    line_end: int,
    type: Comment.Type,
    author_name: str,
) -> str:
    async with in_transaction():
        author = await Player.get(session_id=session_id, username=author_name)
        code = await SourceCode.get_or_none(session_id=session_id)
        if code is None:
            raise NoSelectedCodeError()
        comment = await Comment.create(
            line_start=line_start,
            line_end=line_end,
            content=content,
            type=type,
            author_id=author.id,
            source_code_id=code.id,
        )
        return str(comment.id)


async def ready_up(session_id: str, player_name: str):
    await Player.filter(session_id=session_id, username=player_name).update(
        is_ready=True
    )


async def wait(session_id: str, player_name: str):
    await Player.filter(session_id=session_id, username=player_name).update(
        is_ready=False
    )


async def is_ready_to_advance(session_id: str):
    players = await Player.filter(session_id=session_id, is_connected=True)
    return len(players) > 0 and all([player.is_ready for player in players])


async def is_terminated(session_id: str):
    session = await Session.get(id=session_id)
    return session.is_terminated
