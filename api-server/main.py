import redis
from typing import List
from fastapi import FastAPI, status

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
    r.set("foo", "bar")
    value = r.get("foo")
    return value
    id = generate(size=10)
    invalid_authors = get_invalid_authors(get_github_instance(), pre_determined_authors)
    if invalid_authors:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"invalid usernames: {invalid_authors}",
        )
    session = session_factory(id, pre_determined_authors)
    try:
        session.setup()
        db[id] = session
    except Exception as e:
        logging.error("Failed to setup, reason %s", str(e))
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))

    return {"id": id}
