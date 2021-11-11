from fastapi import FastAPI
from routes import session



app = FastAPI()
app.include_router(session.router)


