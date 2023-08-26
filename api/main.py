import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise import Tortoise
from config import DB_URI
from routes import socket_app, session, auth, user, misc
from metrics import attach_instrumentation

logger = logging.getLogger()

app = FastAPI()
app.include_router(auth.router)
app.include_router(session.router)
app.include_router(user.router)
app.include_router(misc.router)

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def init_db_tables():
    await Tortoise.init(db_url=DB_URI, modules={"models": ["db.models"]})
    await Tortoise.generate_schemas(safe=True)
    logger.info("DB tables are ready to go!")
    attach_instrumentation(app)
    logger.info("Instrumentation is ready to go!")


@app.on_event("shutdown")
async def close_db_connections():
    await Tortoise.close_connections()


@app.get("/hello")
def greeting():
    return {"msg": "api server"}


app.mount("/socket", socket_app)
if __name__ == "__main__":
    uvicorn.run(app, port=8001, log_config="./log.ini")
