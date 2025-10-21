from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import random
import string

from backend import crud, model, schemas, auth
from backend.database import SessionLocal, engine

model.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# In-memory storage for OTPs (for simplicity, replace with a more robust solution in production)
otp_storage = {}

@app.post("/signup")
async def signup(email: schemas.EmailStr, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate and send OTP
    otp = ''.join(random.choices(string.digits, k=6))
    otp_storage[email] = otp # Store OTP
    
    await auth.send_otp_email(email, otp)
    
    return {"message": "OTP sent to your email"}

@app.post("/verify-otp")
def verify_otp(otp_data: schemas.OTPVerify):
    stored_otp = otp_storage.get(otp_data.email)
    if not stored_otp or stored_otp != otp_data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Clear the OTP after successful verification
    del otp_storage[otp_data.email]
    
    return {"message": "OTP verified successfully"}

@app.post("/getting-started", response_model=schemas.Token)
def getting_started(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    crud.create_user(db=db, user=user)
    
    # Create and return a JWT token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
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