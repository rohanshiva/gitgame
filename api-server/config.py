import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_ACCESS_TOKEN = os.environ.get("GITHUB_ACCESS_TOKEN")
DB_URI = "postgres://postgres:gitgame_password@host.docker.internal:5433/gitgame_db"
