import logging
from tortoise import Tortoise
from config import DB_URI
from api.app import app

logger = logging.getLogger()


@app.on_event("startup")
async def init_db_tables():
    await Tortoise.init(db_url=DB_URI, modules={"models": ["api.models"]})
    await Tortoise.generate_schemas(safe=True)
    logger.info("DB tables are ready to go!")


@app.on_event("shutdown")
async def close_db_connections():
    await Tortoise.close_connections()


@app.get("/hello")
def greeting():
    return {"msg": "api server"}
