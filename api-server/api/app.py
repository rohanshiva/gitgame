from fastapi import FastAPI
from api.routes import session

app = FastAPI()
app.include_router(session.router)
