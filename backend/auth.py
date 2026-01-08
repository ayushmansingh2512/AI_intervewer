from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from typing import Optional
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
import requests
import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import get_db
import resend


load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Google OAuth2 settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# Password Hashing - Use bcrypt directly instead of passlib for better compatibility
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against a hashed password.
    
    Truncates password to 72 bytes to match bcrypt's limit.
    """
    # Ensure password is bytes and truncate to 72 bytes
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
    
    try:
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """
    Hashes the given password using bcrypt.
    
    Truncates password to 72 bytes to satisfy bcrypt's limit.
    """
    # Ensure password is bytes and truncate to 72 bytes
    password_bytes = password.encode('utf-8')[:72]
    
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Return as string for database storage
    return hashed.decode('utf-8')

# JWT Token Creation
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# SendGrid Email Configuration
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "ayushmansingh2512@gmail.com")

async def send_otp_email(email: str, otp: str):
    current_year = datetime.now().year
    
    body = f"""
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #1A1817; padding: 25px; text-align: center;">
           <h1 style="color: #D4A574; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 300;">NOODLE LAB</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px; color: #333333; text-align: center;">
          <h2 style="color: #1A1817; margin-top: 0; font-weight: 400; font-size: 22px;">Verification Code</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 30px;">
            Please use the code below to verify your account or complete your login for Noodle Lab.
          </p>
          
          <div style="background-color: #f0f0f0; border-radius: 8px; padding: 20px; display: inline-block; letter-spacing: 5px;">
            <span style="font-size: 32px; font-weight: bold; color: #1A1817; font-family: monospace;">{otp}</span>
          </div>

          <p style="font-size: 14px; color: #888888; margin-top: 30px;">
            This code will expire in 10 minutes.<br>If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #999999;">
          &copy; {current_year} Noodle Lab.
        </div>
      </div>
    </div>
    """
    
    message = Mail(
        from_email=SENDGRID_FROM_EMAIL,
        to_emails=email,
        subject="Your Verification Code - Noodle Lab",
        html_content=body
    )
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"SendGrid OTP email sent: {response.status_code}")
    except Exception as e:
        print(f"SendGrid error: {e}")
        raise

# Google OAuth2 Flow
def get_google_flow():
    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }
    return Flow.from_client_config(
        client_config,
        scopes=['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email', 'openid'],
        redirect_uri=GOOGLE_REDIRECT_URI
    )

def get_google_auth_url(state: str = None):
    flow = get_google_flow()
    kwargs = {
        'access_type': 'offline',
        'include_granted_scopes': 'true'
    }
    if state:
        kwargs['state'] = state
        
    authorization_url, state = flow.authorization_url(**kwargs)
    return authorization_url

def get_google_user_info(code: str):
    flow = get_google_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials
    
    user_info_res = requests.get(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        headers={'Authorization': f'Bearer {credentials.token}'}
    )
    
    if user_info_res.status_code == 200:
        return user_info_res.json()
    return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user