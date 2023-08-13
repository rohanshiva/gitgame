from tortoise import fields, models
from enum import Enum
from pathlib import Path


class Session(models.Model):
    id = fields.CharField(max_length=20, pk=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    version = fields.IntField(default=0)
    is_terminated = fields.BooleanField(default=False)
    players: fields.ReverseRelation["Player"]


class Player(models.Model):
    id = fields.UUIDField(pk=True)
    username = fields.CharField(max_length=30)
    is_connected = fields.BooleanField(default=True)
    is_ready = fields.BooleanField(default=False)
    session: fields.ForeignKeyRelation[Session] = fields.ForeignKeyField(
        "models.Session", "players"
    )
    repos: fields.ReverseRelation["Repository"]

    @property
    def profile_url(self):
        return f"https://avatars.githubusercontent.com/{self.username}"


class Repository(models.Model):
    id = fields.UUIDField(pk=True)
    is_loaded = fields.BooleanField(default=False)
    name = fields.CharField(max_length=100)
    default_branch = fields.CharField(max_length=100)
    last_pushed_at = fields.DatetimeField()

    author: fields.ForeignKeyRelation[Player] = fields.ForeignKeyField(
        "models.Player", "repos"
    )


class File(models.Model):
    id = fields.UUIDField(pk=True)

    path = fields.CharField(max_length=200)
    download_url = fields.CharField(max_length=200)
    visit_url = fields.CharField(max_length=200)

    repo: fields.ForeignKeyRelation[Repository] = fields.ForeignKeyField(
        "models.Repository", "files"
    )

    author: fields.ForeignKeyRelation[Player] = fields.ForeignKeyField(
        "models.Player", "files"
    )

    session: fields.ForeignKeyRelation[Session] = fields.ForeignKeyField(
        "models.Session", "files"
    )

    @property
    def name(self):
        return Path(self.path).name

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
