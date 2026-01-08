
from fastapi.responses import RedirectResponse

from backend import auth

def auth_google(type: str = "talent"):
    return RedirectResponse(url=auth.get_google_auth_url(state=type))
