
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
        raise HTTPException(status_code=400, detail="Email already registered")
    
    otp = ''.join(random.choices(string.digits, k=6))
    otp_storage[email_data.email] = {
        "otp": otp,
        "timestamp": datetime.utcnow()
    }
    
    await auth.send_otp_email(email_data.email, otp)
    
    return {"message": "OTP sent to your email"}
