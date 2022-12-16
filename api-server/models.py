from tortoise import fields, models
from tortoise.transactions import in_transaction
from enum import Enum
from datetime import datetime
from uuid import uuid4
from services.github_client import GithubClient, GithubRepositoryFileLoadingError
import logging

logger = logging.getLogger()


class Session(models.Model):
    class State(str, Enum):
        CREATED = "created"
        LOBBY = "lobby"

    id = fields.CharField(max_length=20, pk=True)
    state = fields.CharEnumField(State, max_length=20)
    created_at = fields.DatetimeField(auto_now_add=True)

    # nullable, stores the host player's id. Attempting to make this a type of a ForeignKey relation will result in an 'cylical fk reference' error by Tortoise
    host = fields.CharField(null=True, max_length=40)
    players: fields.ReverseRelation["Player"]


class Player(models.Model):
    MAX_REPOS_TO_GENERATE_FILES = 5
    SUPPORTED_EXTENSIONS = [
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

    class ConnectionState(str, Enum):
        CONNECTED = "connected"
        DISCONNECTED = "disconnected"

    # id will be of the format "{session_id}-{username}"
    id = fields.CharField(max_length=40, pk=True)
    username = fields.CharField(max_length=30)
    connection_state = fields.CharEnumField(ConnectionState, max_length=20)
    session: fields.ForeignKeyRelation[Session] = fields.ForeignKeyField(
        "models.Session", "players"
    )

    # todo(ramko9999): if necessary, add the next_page number to fetch the next set of repos as an db field
    repos: fields.ReverseRelation["Repository"]

    async def load_repos(self, gh_client: GithubClient):
        repos, _ = await gh_client.get_non_forked_repos(self.username, min_repos=100)

        repo_models = []
        for repo in repos:
            repo_models.append(
                Repository(
                    id=uuid4(),
                    name=repo["name"],
                    description=repo["description"],
                    stars=repo["stars"],
                    language=repo["language"],
                    default_branch=repo["default_branch"],
                    url=repo["url"],
                    last_pushed_at=datetime.fromisoformat(
                        repo["pushed_at"].replace("Z", "+00:00")
                    ),
                    author=self,
                )
            )

        await Repository.bulk_create(repo_models)
        logger.info(
            f"Found {len(repo_models)} available repos for author {self.username}"
        )

    async def load_files(self, gh_client: GithubClient):
        async with in_transaction():
            repos = await self.repos.filter(load_status=False).order_by(
                "last_pushed_at"
            )

            loaded_repo_ids = []
            repo_index = 0
            non_empty_repo_count = 0
            file_models = []
            while (
                non_empty_repo_count < self.MAX_REPOS_TO_GENERATE_FILES
                and repo_index < len(repos)
            ):
                repo = repos[repo_index]
                try:
                    files = await gh_client.get_files_for_repo(
                        repo.name,
                        repo.default_branch,
                        self.SUPPORTED_EXTENSIONS,
                    )
                    for file in files:
                        file_models.append(
                            File(
                                name=file["name"],
                                path=file["path"],
                                download_url=file["download_url"],
                                repo=repo,
                            )
                        )
                    loaded_repo_ids.append(repo.id)
                    repo_index += 1
                    if len(files) > 0:
                        non_empty_repo_count += 1
                except GithubRepositoryFileLoadingError:
                    pass

            if len(loaded_repo_ids) > 0:
                await Repository.filter(id__in=loaded_repo_ids).update(load_status=True)
            if len(file_models) > 0:
                await File.bulk_create(file_models)
            logger.info(
                f"Extracted {len(file_models)} files from {len(loaded_repo_ids)} repos for author {self.username}"
            )


class Repository(models.Model):
    id = fields.UUIDField(pk=True)

    load_status = fields.BooleanField(default=False)
    name = fields.CharField(max_length=100)
    description = fields.CharField(max_length=500, null=True)
    stars = fields.IntField()
    language = fields.CharField(max_length=20, null=True)
    default_branch = fields.CharField(max_length=100)
    url = fields.CharField(max_length=200)
    last_pushed_at = fields.DatetimeField()

    author: fields.ForeignKeyRelation[Session] = fields.ForeignKeyField(
        "models.Player", "repos"
    )


class File(models.Model):
    id = fields.UUIDField(pk=True)

    name = fields.CharField(max_length=100)
    path = fields.CharField(max_length=200)
    download_url = fields.CharField(max_length=200)

    repo: fields.ForeignKeyRelation[Repository] = fields.ForeignKeyField(
        "models.Repository", "files"
    )
