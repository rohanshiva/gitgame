import os
from dotenv import load_dotenv
import argparse

load_dotenv()

GITHUB_ACCESS_TOKEN = os.environ.get("GITHUB_ACCESS_TOKEN")
DB_URI = os.environ.get("DB_URI")
TEST_DB_URI = os.environ.get("TEST_DB_URI")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET")
GITHUB_ACCESS_TOKEN_ENDPOINT = os.environ.get("GITHUB_ACCESS_TOKEN_ENDPOINT")
GITHUB_LOGIN_ENDPOINT = os.environ.get("GITHUB_LOGIN_ENDPOINT")
AUTH_SECRET = os.environ.get("AUTH_SECRET")

"""
Added this bit here to make local testing easy. Run `python main.py -da -u <YOUR_GH_USERNAME>`

Example: `python main.py -da -u ramko9999` to run app without auth as ramko9999
"""
parser = argparse.ArgumentParser()

parser.add_argument("-u", "--username", required=False)
parser.add_argument("-da", "--disable-auth", action="store_true", required=False)

args = parser.parse_args()

DISABLE_AUTH = args.disable_auth
USERNAME = args.username

if DISABLE_AUTH and not USERNAME:
    raise Exception(
        "Please provide username to run app without auth. Example: `python main.py -da -u <YOUR_GH_USERNAME>`"
    )
