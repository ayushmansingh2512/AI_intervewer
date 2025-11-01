
from fastapi.responses import RedirectResponse

from backend import auth

def auth_google():
    return RedirectResponse(url=auth.get_google_auth_url())
