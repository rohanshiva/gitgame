from fastapi import FastAPI

app = FastAPI()

@app.get("/hello")
def greeting():
    return {"msg": "api server"}