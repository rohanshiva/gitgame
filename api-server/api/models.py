from tortoise import fields, models
from enum import Enum


class Session(models.Model):
    class State(str, Enum):
        CREATED = "created"
        LOBBY = "lobby"

    id = fields.CharField(max_length=20, pk=True)
    state = fields.CharEnumField(State, null=False, required=True, max_length=20)
    created_at = fields.DatetimeField(auto_now_add=True)

    # nullable, stores the host player's id. Attempting to make this a type of a ForeignKey relation will result in an 'cylical fk reference' error by Tortoise
    host = fields.CharField(null=True, max_length=40)
    players: fields.ReverseRelation["Player"]


class Player(models.Model):
    class ConnectionState(str, Enum):
        CONNECTED = "connected"
        DISCONNECTED = "disconnected"

    id = fields.CharField(max_length=40, pk=True)
    username = fields.CharField(max_length=30, null=False, required=True)
    connection_state = fields.CharEnumField(
        ConnectionState, null=False, required=True, max_length=20
    )
    session: fields.ForeignKeyRelation[Session] = fields.ForeignKeyField(
        "models.Session", "players"
    )
