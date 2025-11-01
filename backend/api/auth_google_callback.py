
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from backend import crud, schemas, auth
from backend.database import get_db

def auth_google_callback(code: str, db: Session = Depends(get_db)):
    user_info = auth.get_google_user_info(code)
    if not user_info:
        raise HTTPException(status_code=400, detail="Invalid Google authentication")
    
    db_user = crud.get_user_by_email(db, email=user_info["email"])
    if not db_user:
        db_user = crud.create_google_user(db, user_info)
        
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}
