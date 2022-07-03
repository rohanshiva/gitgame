from pony.orm import *

db = Database()


class Session(db.Entity):
    id = PrimaryKey(str)
    host = Optional(str)
    state = Required(str)
    players = Set("Player")


class Player(db.Entity):
    session_id = Required(Session)
    username = Required(str)
    connection_state = Required(str)
    PrimaryKey(session_id, username)


db.bind(
    provider="postgres",
    host="localhost",
    user="postgres",
    password="gitgame_password",
    database="gitgame_db",
    port="5433",
)
db.generate_mapping(create_tables=True)
