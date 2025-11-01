
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from backend import crud, schemas, auth
from backend.database import get_db
from backend.api.verify_otp import verified_emails

def getting_started(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.email not in verified_emails:
        raise HTTPException(
            status_code=400, 
            detail="Email not verified. Please complete OTP verification first"
        )
    
    time_diff = datetime.utcnow() - verified_emails[user.email]
    if time_diff > timedelta(minutes=30):
        del verified_emails[user.email]
        raise HTTPException(
            status_code=400,
            detail="Email verification expired. Please verify again"
        )
    
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    crud.create_user(db=db, user=user)
    del verified_emails[user.email]
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
