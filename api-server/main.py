import logging
from fastapi import FastAPI
from tortoise import Tortoise
from config import DB_URI
from api.routes import session

logger = logging.getLogger()

app = FastAPI()
app.include_router(session.router)


@app.on_event("startup")
async def init_db_tables():
    await Tortoise.init(db_url=DB_URI, modules={"models": ["api.models"]})

    await Tortoise.generate_schemas(safe=True)
    logger.info("DB tables are ready to go!")


@app.get("/hello")
def greeting():
    return {"msg": "api server"}
