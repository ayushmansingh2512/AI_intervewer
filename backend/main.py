from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import random
import string
from datetime import datetime, timedelta

from backend import crud, model, schemas, auth
from backend.database import SessionLocal, engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
@app.on_event("startup")
async def startup_db():
    try:
        model.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Could not create tables: {e}")
        # Don't crash the app if tables already exist

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# In-memory storage for OTPs and verified emails
# Format: otp_storage[email] = {"otp": "123456", "timestamp": datetime}
# Format: verified_emails[email] = timestamp
otp_storage = {}
verified_emails = {}

# OTP expiry time (5 minutes)
OTP_EXPIRY_MINUTES = 5

@app.post("/signup")
async def signup(email_data: schemas.EmailRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = crud.get_user_by_email(db, email=email_data.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate and send OTP
    otp = ''.join(random.choices(string.digits, k=6))
    otp_storage[email_data.email] = {
        "otp": otp,
        "timestamp": datetime.utcnow()
    }
    
    await auth.send_otp_email(email_data.email, otp)
    
    return {"message": "OTP sent to your email"}

@app.post("/verify-otp")
def verify_otp(otp_data: schemas.OTPVerify):
    # Check if OTP exists
    stored_data = otp_storage.get(otp_data.email)
    if not stored_data:
        raise HTTPException(status_code=400, detail="No OTP found for this email")
    
    # Check if OTP is expired
    time_diff = datetime.utcnow() - stored_data["timestamp"]
    if time_diff > timedelta(minutes=OTP_EXPIRY_MINUTES):
        del otp_storage[otp_data.email]
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    # Verify OTP
    if stored_data["otp"] != otp_data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Mark email as verified and clear OTP
    verified_emails[otp_data.email] = datetime.utcnow()
    del otp_storage[otp_data.email]
    
    return {"message": "OTP verified successfully"}

@app.post("/getting-started", response_model=schemas.Token)
def getting_started(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email was verified
    if user.email not in verified_emails:
        raise HTTPException(
            status_code=400, 
            detail="Email not verified. Please complete OTP verification first"
        )
    
    # Check if verification is still valid (30 minutes window)
    time_diff = datetime.utcnow() - verified_emails[user.email]
    if time_diff > timedelta(minutes=30):
        del verified_emails[user.email]
        raise HTTPException(
            status_code=400,
            detail="Email verification expired. Please verify again"
        )
    
    # Check if user already exists
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    crud.create_user(db=db, user=user)
    
    # Clear verified email status
    del verified_emails[user.email]
    
    # Create and return a JWT token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if it's a Google user trying to login with password
    if db_user.is_google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please use Google Sign-In for this account",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/google")
def auth_google():
    return RedirectResponse(url=auth.get_google_auth_url())

@app.get("/auth/google/callback", response_model=schemas.Token)
def auth_google_callback(code: str, db: Session = Depends(get_db)):
    user_info = auth.get_google_user_info(code)
    if not user_info:
        raise HTTPException(status_code=400, detail="Invalid Google authentication")
    
    db_user = crud.get_user_by_email(db, email=user_info["email"])
    if not db_user:
        db_user = crud.create_google_user(db, user_info)
        
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# Optional: Cleanup expired OTPs periodically
@app.on_event("startup")
async def startup_event():
    import asyncio
    
    async def cleanup_expired_data():
        while True:
            await asyncio.sleep(300)  # Run every 5 minutes
            current_time = datetime.utcnow()
            
            # Clean expired OTPs
            expired_otps = [
                email for email, data in otp_storage.items()
                if current_time - data["timestamp"] > timedelta(minutes=OTP_EXPIRY_MINUTES)
            ]
            for email in expired_otps:
                del otp_storage[email]
            
            # Clean expired verifications
            expired_verifications = [
                email for email, timestamp in verified_emails.items()
                if current_time - timestamp > timedelta(minutes=30)
            ]
            for email in expired_verifications:
                del verified_emails[email]
    
    asyncio.create_task(cleanup_expired_data())