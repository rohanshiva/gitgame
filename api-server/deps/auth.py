from typing import Union
from services.auth import Auth, Context
from fastapi import Cookie, HTTPException, status
from config import DISABLE_AUTH, USERNAME


async def get_context(token: Union[str, None] = Cookie(default=None)):
    # To enable local testing w/o auth
    if DISABLE_AUTH and USERNAME:
        return Context(username=USERNAME, is_expiring=False)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        context = Auth.decode(token)
        return context
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
