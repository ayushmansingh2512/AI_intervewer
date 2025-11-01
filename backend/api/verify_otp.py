
from fastapi import HTTPException
from datetime import datetime, timedelta

from backend import schemas
from backend.api.signup import otp_storage

# In-memory storage for verified emails
verified_emails = {}
OTP_EXPIRY_MINUTES = 5

def verify_otp(otp_data: schemas.OTPVerify):
    stored_data = otp_storage.get(otp_data.email)
    if not stored_data:
        raise HTTPException(status_code=400, detail="No OTP found for this email")
    
    time_diff = datetime.utcnow() - stored_data["timestamp"]
    if time_diff > timedelta(minutes=OTP_EXPIRY_MINUTES):
        del otp_storage[otp_data.email]
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    if stored_data["otp"] != otp_data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    verified_emails[otp_data.email] = datetime.utcnow()
    del otp_storage[otp_data.email]
    
    return {"message": "OTP verified successfully"}
