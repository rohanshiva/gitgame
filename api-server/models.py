import logging
import random
from tortoise import fields, models
from tortoise.transactions import in_transaction
from collections import defaultdict
from enum import Enum
from datetime import datetime
from uuid import uuid4, UUID
from services.github_client import (
    GithubClient,
    GithubUserNotFound,
    GithubRepositoryFileLoadingError,
)
from pathlib import Path

LOGGER = logging.getLogger()


class AlreadyConnectedPlayerError(Exception):
    pass


class PlayerNotInGithubError(Exception):
    pass


class OutOfFilesError(Exception):
    pass


class NoSelectedSourceCodeError(Exception):
    pass


class Session(models.Model):
    id = fields.CharField(max_length=20, pk=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    version = fields.IntField(default=0)

    # nullable, stores the host player's id. Attempting to make this a type of a ForeignKey relation will result in an 'cylical fk reference' error by Tortoise
    host = fields.CharField(null=True, max_length=40)
    players: fields.ReverseRelation["Player"]

    def get_player_id(self, username: str):
        return f"{self.id}-{username}"

    async def join(self, username: str, gh_client: GithubClient):
        player_id = self.get_player_id(username)
        LOGGER.info(f"{player_id} is trying to join")
        async with in_transaction():
            await self.select_for_update()
            await self.refresh_from_db()
            player = await Player.get_or_none(id=player_id)
            if player and player.connection_state == Player.ConnectionState.CONNECTED:
                raise AlreadyConnectedPlayerError()

            LOGGER.info(
                f"{player_id} is joining with host {self.host}, version: {self.version}"
            )
            if player:
                player.connection_state = Player.ConnectionState.CONNECTED
                await player.save(update_fields=["connection_state"])
            else:
                player = Player(
                    id=player_id,
                    session_id=self.id,
                    username=username,
                    connection_state=Player.ConnectionState.CONNECTED,
                )
                await player.save()

                try:
                    await player.load_repos(gh_client)
                except GithubUserNotFound:
                    raise PlayerNotInGithubError()
                await player.load_files(gh_client)

            update_fields = ["version"]
            if self.host is None:
                self.host = player.id
                update_fields.append("host")

            self.version += 1
            await self.save(update_fields=update_fields)
            LOGGER.info(
                f"{player_id} is joining update complete, version: {self.version}"
            )

    async def leave(self, username: str):
        player_id = self.get_player_id(username)
        LOGGER.info(f"{player_id} is trying to leave")
        async with in_transaction():
            await self.select_for_update()
            await self.refresh_from_db()
            player = await Player.get(id=player_id)
            player.connection_state = Player.ConnectionState.DISCONNECTED
            await player.save(update_fields=["connection_state"])
            LOGGER.info(
                f"{player_id} is leaving with host {self.host}, version: {self.version}"
            )
            update_fields = ["version"]
            if self.host == player_id:
                connected_players = await self.players.filter(
                    connection_state=Player.ConnectionState.CONNECTED
                )
                # todo(ramko9999): How should we handle the clean up of a session and other rows referencing it in the DB if all players leave
                if len(connected_players) > 0:
                    new_host = random.choice(connected_players)
                    self.host = new_host.id
                    LOGGER.info(f"Host changing to {new_host.id} for {self.id}")
                else:
                    self.host = None
                update_fields.append("host")
            self.version += 1
            await self.save(update_fields=update_fields)
            LOGGER.info(
                f"{username} leaving update has been applied to {self.id}, version: {self.version}"
            )

    async def pick_source_code(self, gh_client: GithubClient):
        async with in_transaction():
            previous_source_code = await self.get_source_code()
            if previous_source_code is not None:
                await previous_source_code.file.delete()  # deletes file then cascades down to delete the previous source code

            files = await File.filter(session_id=self.id)
            if len(files) == 0:
                raise OutOfFilesError()

            files_by_author_repo: dict[tuple, list[File]] = defaultdict(list)
            for file in files:
                author_repo = (file.author_id, file.repo_id)
                files_by_author_repo[author_repo].append(file)

            authors_in_pool = set([])
            for (author, _) in files_by_author_repo:
                authors_in_pool.add(author)

            picked_author = random.choice(list(authors_in_pool))
            repos_in_pool_for_picked_author = set([])
            for (author, repo) in files_by_author_repo:
                if author == picked_author:
                    repos_in_pool_for_picked_author.add(repo)

            picked_repo = random.choice(list(repos_in_pool_for_picked_author))
            picked_author_repo = (picked_author, picked_repo)
            picked_file = random.choice(files_by_author_repo[picked_author_repo])
            # todo: catch error when file download is not possible
            file_content = await gh_client.download_file_from_url(
                picked_file.download_url
            )
            next_source_code = SourceCode(
                content=file_content, session=self, file=picked_file
            )

            total_files_for_picked_author = 0
            for (author, repo) in files_by_author_repo:
                if author == picked_author:
                    total_files_for_picked_author += len(
                        files_by_author_repo[(author, repo)]
                    )

            if total_files_for_picked_author == 1:
                # the last file in the DB for the author was picked, so replenish files for this author
                author = await Player.filter(id=picked_author).first()
                await author.load_files(gh_client)

            await next_source_code.save()
            LOGGER.info(
                f"Selected file {picked_file.path} authored by {picked_file.author_id}"
            )

    async def get_source_code(self):
        return await SourceCode.filter(session_id=self.id).first()

    async def add_comment(
        self,
        content: str,
        line_start: int,
        line_end: int,
        type: "Comment.Type",
        username: str,
    ):
        player_id = self.get_player_id(username)
        async with in_transaction():
            source_code = await self.get_source_code()
            if source_code is None:
                raise NoSelectedSourceCodeError()
            db_comment = Comment(
                content=content,
                line_start=line_start,
                line_end=line_end,
                type=type,
                author_id=player_id,
                source_code_id=source_code.id,
            )
            await db_comment.save()
            return db_comment

    async def delete_comment(self, comment_id: UUID):
        await Comment.filter(id=comment_id).delete()


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
        LOGGER.info(
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
                                visit_url=file["visit_url"],
                                repo=repo,
                                author=self,
                                session_id=self.session_id,
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
            LOGGER.info(
                f"Extracted {len(file_models)} files from {len(loaded_repo_ids)} repos for author {self.username}"
            )

    @property
    def profile_url(self):
        return f"https://avatars.githubusercontent.com/{self.username}"


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
    visit_url = fields.CharField(max_length=200)

    repo: fields.ForeignKeyRelation[Repository] = fields.ForeignKeyField(
        "models.Repository", "files"
    )

    author: fields.ForeignKeyRelation[Repository] = fields.ForeignKeyField(
        "models.Player", "files"
    )

    session: fields.ForeignKeyRelation[Session] = fields.ForeignKeyField(
        "models.Session", "files"
    )

    @property
    def extension(self):
        return Path(self.path).suffix[1:]


class SourceCode(models.Model):
    id = fields.UUIDField(pk=True)
    content = fields.TextField()

    file: fields.ForeignKeyRelation[File] = fields.ForeignKeyField(
        "models.File", "source_code"
    )

    session: fields.ForeignKeyRelation[Session] = fields.ForeignKeyField(
        "models.Session", "source_code"
    )

    comments: fields.ReverseRelation["Comment"]


class Comment(models.Model):
    class Type(str, Enum):
        POOP = "poop"
        DIAMOND = "diamond"

    id = fields.UUIDField(pk=True)
    content = fields.TextField()
    type = fields.CharEnumField(Type, max_length=20)
    line_start = fields.IntField()
    line_end = fields.IntField()

    author: fields.ForeignKeyRelation[Player] = fields.ForeignKeyField(
        "models.Player", "comments"
    )

    source_code: fields.ForeignKeyRelation[SourceCode] = fields.ForeignKeyField(
        "models.SourceCode", "comments"
    )
