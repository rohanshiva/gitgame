from fastapi import FastAPI
from routes import session
import uvicorn

app = FastAPI()
app.include_router(session.router)

if __name__ == "__main__":
    print("Server is running...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_config="./log.ini")
