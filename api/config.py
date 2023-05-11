import os
from dotenv import load_dotenv
import argparse

load_dotenv()

GITHUB_ACCESS_TOKEN = os.environ.get("GITHUB_ACCESS_TOKEN")
DB_URI = os.environ.get("DB_URI")
TEST_DB_URI = os.environ.get("TEST_DB_URI")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET")
AUTH_SECRET = os.environ.get("AUTH_SECRET")
CLIENT_URL = os.environ.get("CLIENT_URL")
GITHUB_ACCESS_TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token"
GITHUB_LOGIN_ENDPOINT = "https://github.com/login/oauth/authorize"

"""
Added this bit here to make local testing easy. Run `python main.py -d`

Example: `python main.py -d` to run app without auth
"""
parser = argparse.ArgumentParser()

parser.add_argument("-d", "--disable-auth", action="store_true", required=False)

args = parser.parse_args()

DISABLE_AUTH = args.disable_auth
