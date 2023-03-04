from typing import Union
from services.auth import Auth
from fastapi import Cookie, HTTPException, status


async def get_context(token: Union[str, None] = Cookie(default=None)):
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
