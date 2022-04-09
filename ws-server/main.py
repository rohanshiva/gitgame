from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ws.routes import session
from ws.routes import socket_app
import uvicorn

app = FastAPI()
app.include_router(session.router)

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/socket", socket_app)

@app.get("/hello")
def greet():
    return {"msg": "gitgame ws server"}

# HOST = "0.0.0.0"
# PORT = 8000

# if __name__ == "__main__":
#     print(f"Server is running on http://localhost:{PORT}")
#     uvicorn.run(app, host=HOST, port=PORT, log_config="./log.ini")
