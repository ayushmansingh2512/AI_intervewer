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

async def send_interview_email(email: str, interview_link: str, company_name: str, scheduled_time: str = None, duration_minutes: int = None):
    if scheduled_time:
        # Email for scheduled interview
        duration_text = f" The interview will be available for {duration_minutes // 60} hour(s)." if duration_minutes else ""
        body = f"""
        <p>Dear Candidate,</p>
        <p>You have been invited to an interview with <strong>{company_name}</strong>.</p>
        <p><strong>Scheduled Time:</strong> {scheduled_time}</p>
        {f'<p><strong>Duration:</strong> {duration_minutes // 60} hour(s)</p>' if duration_minutes else ''}
        <p>Please click the link below to access the interview at the scheduled time:</p>
        <p><a href="{interview_link}" style="display: inline-block; padding: 12px 24px; background-color: #D4A574; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">Access Interview</a></p>
        <p><em>Note: The interview link will only be accessible during the scheduled time window.</em></p>
        <p>Best regards,<br>{company_name}</p>
        """
    else:
        # Email for immediate interview
        body = f"""
        <p>Dear Candidate,</p>
        <p>You have been invited to an interview with <strong>{company_name}</strong>.</p>
        <p>Please click the link below to start the interview:</p>
        <p><a href="{interview_link}" style="display: inline-block; padding: 12px 24px; background-color: #D4A574; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">Start Interview</a></p>
        <p>Best regards,<br>{company_name}</p>
        """
    
    message = MessageSchema(
        subject=f"Invitation to Interview with {company_name}",
        recipients=[email],
        body=body,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_suspicious_activity_email(company_email: str, candidate_email: str, interview_id: str, reason: str, screenshot_bytes: bytes = None):
    from fastapi_mail import MessageType
    import base64
    
    body = f"""
    <p>Dear Company,</p>
    <p>Suspicious activity was detected during the interview for candidate <strong>{candidate_email}</strong> (Interview ID: <strong>{interview_id}</strong>).</p>
    <p>Reason: <strong>{reason}</strong></p>
    <p>Please review the interview recording if available.</p>
    """
    
    if screenshot_bytes:
        # Convert screenshot to base64 for embedding in email
        screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
        body += f"""
        <p><strong>Screenshot at time of detection:</strong></p>
        <img src="data:image/jpeg;base64,{screenshot_base64}" alt="Screenshot" style="max-width: 600px; border: 2px solid #ccc; border-radius: 8px;"/>
        """
    
    body += """
    <p>Regards,</p>
    <p>Your Interview Platform</p>
    """
    
    message = MessageSchema(
        subject=f"Suspicious Activity Detected During Interview {interview_id}",
        recipients=[company_email],
        body=body,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message)

