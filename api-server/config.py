import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_ACCESS_TOKEN = os.environ.get("GITHUB_ACCESS_TOKEN")
DB_URI = os.environ.get("DB_URI")
TEST_DB_URI = os.environ.get("TEST_DB_URI")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET")
GITHUB_ACCESS_TOKEN_ENDPOINT = os.environ.get("GITHUB_ACCESS_TOKEN_ENDPOINT")
GITHUB_LOGIN_ENDPOINT = os.environ.get("GITHUB_LOGIN_ENDPOINT")
AUTH_SECRET = os.environ.get("AUTH_SECRET")
