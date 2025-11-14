from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import random
import string
from datetime import datetime

from backend.compony_api import crud, schemas, auth
from backend.database import get_db

router = APIRouter()

# In-memory storage for OTPs
otp_storage = {}
OTP_EXPIRY_MINUTES = 5

@router.post("/signup", status_code=200)
async def signup(company_data: schemas.CompanyCreate, db: Session = Depends(get_db)):
    db_company = crud.get_company_by_email(db, email=company_data.email)
    if db_company:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create company with just email and name
    crud.create_company(db=db, company=company_data)
    
    otp = ''.join(random.choices(string.digits, k=6))
    otp_storage[company_data.email] = {
        "otp": otp,
        "timestamp": datetime.utcnow()
    }
    
    await auth.send_otp_email(company_data.email, otp)
    
    return {"message": "OTP sent to your email"}

@router.post("/verify-otp", status_code=200)
def verify_otp(otp_data: schemas.OTPVerify, db: Session = Depends(get_db)):
    stored_data = otp_storage.get(otp_data.email)
    if not stored_data:
        raise HTTPException(status_code=400, detail="No OTP found for this email")
    
    time_diff = datetime.utcnow() - stored_data["timestamp"]
    if time_diff.total_seconds() > OTP_EXPIRY_MINUTES * 60:
        del otp_storage[otp_data.email]
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    if stored_data["otp"] != otp_data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    crud.verify_company(db, email=otp_data.email)
    del otp_storage[otp_data.email]
    
    return {"message": "OTP verified successfully"}

@router.post("/getting-started", response_model=schemas.Token)
def getting_started(company: schemas.CompanyCreate, db: Session = Depends(get_db)):
    if not company.password or len(company.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not company.company_name or not company.company_name.strip():
        raise HTTPException(status_code=400, detail="Company name cannot be empty")

    db_company = crud.get_company_by_email(db, email=company.email)
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")

    if not db_company.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified")

    crud.update_company(db=db, company=company)
    
    access_token = auth.create_access_token(data={"sub": company.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(company: schemas.CompanyLogin, db: Session = Depends(get_db)):
    db_company = crud.get_company_by_email(db, email=company.email)
    if not db_company:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not auth.verify_password(company.password, db_company.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": company.email})
    return {"access_token": access_token, "token_type": "bearer"}
