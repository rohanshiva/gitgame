import jwt
import logging
from typing import TypedDict
from datetime import datetime, timedelta, timezone
from config import AUTH_SECRET

logger = logging.getLogger()


class ExpiredToken(Exception):
    pass


class InvalidToken(Exception):
    pass


class Context(TypedDict):
    username: str
    is_expiring: bool


class Auth:
    @staticmethod
    def encode(username: str):
        payload = {
            "exp": datetime.now(timezone.utc) + timedelta(days=0, minutes=30),
            "sub": username,
        }

        return jwt.encode(payload, AUTH_SECRET, algorithm="HS256")

    @staticmethod
    def decode(token: str):
        try:
            payload = jwt.decode(token, AUTH_SECRET, algorithms=["HS256"])
            res = Context(username=payload["sub"], is_expiring=False)
            exp = datetime.fromtimestamp(payload["exp"], timezone.utc)
            now = datetime.now(timezone.utc)
            delta = exp - now
            if delta.seconds <= timedelta(minutes=30).seconds:
                res["is_expiring"] = True

            return res
        except jwt.ExpiredSignatureError:
            raise ExpiredToken()
        except jwt.InvalidTokenError:
            raise InvalidToken()
