
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
import random
import string
from datetime import datetime

from backend import crud, schemas, auth
from backend.database import get_db

# In-memory storage for OTPs
otp_storage = {}
OTP_EXPIRY_MINUTES = 5

async def signup(email_data: schemas.EmailRequest, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=email_data.email)
    if db_user:
        if db_user.hashed_password:
            raise HTTPException(status_code=400, detail="Email already registered")
        # If user exists but has no password, allow them to restart signup (resend OTP)
        # We don't need to create the user again, just update OTP
    else:
        # Create user with just email
        user = schemas.UserCreate(email=email_data.email)
        crud.create_user(db=db, user=user)
    
    otp = ''.join(random.choices(string.digits, k=6))
    otp_storage[email_data.email] = {
        "otp": otp,
        "timestamp": datetime.utcnow()
    }
    
    await auth.send_otp_email(email_data.email, otp)
    
    return {"message": "OTP sent to your email"}
