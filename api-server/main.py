import redis
from typing import List
from nanoid import generate
from fastapi import FastAPI, status
from tortoise.contrib.fastapi import register_tortoise
app = FastAPI()


REDIS_PORT = 6379

r = redis.Redis(
    host="host.docker.internal",
    port=REDIS_PORT,
)


@app.get("/hello")
def greeting():
    return {"msg": "api server"}


@app.post("/make", status_code=status.HTTP_201_CREATED)
def make_session(pre_determined_authors: List[str]):
    id = generate(size=10)

    return {"id": id}


@app.post("/join/{session_id}", status_code=status.HTTP_202_ACCEPTED)
def join_session(session_id: str):
    return {"session_id": session_id}


register_tortoise(
    app,
    db_url="postgres://postgres:gitgame_password@host.docker.internal:5433/gitgame_db",
    modules={"models": ["models.player"]},
    generate_schemas=True,
)

print("logging")