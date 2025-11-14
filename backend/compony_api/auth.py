from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.compony_api import crud, schemas
from backend.database import get_db
from backend.auth import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, verify_password, get_password_hash, send_otp_email, FastMail, MessageSchema, conf
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="company/token")

def get_current_company(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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
    company = crud.get_company_by_email(db, email=token_data.email)
    if company is None:
        raise credentials_exception
    return company

async def send_interview_email(email: str, interview_link: str, company_name: str):
    message = MessageSchema(
        subject=f"Invitation to Interview with {company_name}",
        recipients=[email],
        body=f"You have been invited to an interview with {company_name}. Please click the link to start the interview: {interview_link}",
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_suspicious_activity_email(company_email: str, candidate_email: str, interview_id: str, reason: str):
    message = MessageSchema(
        subject=f"Suspicious Activity Detected During Interview {interview_id}",
        recipients=[company_email],
        body=f"""
        <p>Dear Company,</p>
        <p>Suspicious activity was detected during the interview for candidate <strong>{candidate_email}</strong> (Interview ID: <strong>{interview_id}</strong>).</p>
        <p>Reason: <strong>{reason}</strong></p>
        <p>Please review the interview recording if available.</p>
        <p>Regards,</p>
        <p>Your Interview Platform</p>
        """,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)
