
from fastapi import Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from backend import crud, schemas, auth
from backend.database import get_db

from backend.compony_api import crud as company_crud

import os

def auth_google_callback(code: str, state: str = "talent", db: Session = Depends(get_db)):
    user_info = auth.get_google_user_info(code)
    if not user_info:
        raise HTTPException(status_code=400, detail="Invalid Google authentication")
    
    access_token = None
    role = state
    
    if state == "company":
        db_company = company_crud.get_company_by_email(db, email=user_info["email"])
        if not db_company:
            db_company = company_crud.create_google_company(db, user_info)
        access_token = auth.create_access_token(data={"sub": db_company.email})
    else:
        # Default to talent
        role = "talent"
        db_user = crud.get_user_by_email(db, email=user_info["email"])
        if not db_user:
            db_user = crud.create_google_user(db, user_info)
        access_token = auth.create_access_token(data={"sub": db_user.email})
    
    # Redirect to frontend with token and role
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(url=f"{frontend_url}/google-callback?token={access_token}&role={role}")
