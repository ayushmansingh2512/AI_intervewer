from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.compony_api import crud, schemas
from backend.database import get_db
from backend.auth import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, verify_password, get_password_hash, send_otp_email, FastMail, MessageSchema, conf
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import tempfile

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="company/token")

def get_current_company(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"DEBUG: Verifying company token: {token[:10]}...") 
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        print(f"DEBUG: Token email sub: {email}")
        if email is None:
            print("DEBUG: Email is None in payload")
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError as e:
        print(f"DEBUG: JWT Decode Error: {e}")
        raise credentials_exception
    company = crud.get_company_by_email(db, email=token_data.email)
    if company is None:
        print(f"DEBUG: Company not found for email: {token_data.email}")
        raise credentials_exception
    print(f"DEBUG: Company verified: {company.email}")
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
        print(f"Embedding screenshot of size: {len(screenshot_bytes)} bytes")
        try:
            screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            body += f"""
            <p><strong>Screenshot at time of detection:</strong></p>
            <img src="data:image/jpeg;base64,{screenshot_base64}" alt="Screenshot" style="max-width: 600px; border: 2px solid #ccc; border-radius: 8px;"/>
            """
        except Exception as e:
            print(f"Error encoding screenshot: {e}")
            body += f"<p>Error attaching screenshot: {e}</p>"
            
    attachments = []
    if screenshot_bytes:
        try:
            # Create a temp file for attachment
            fd, path = tempfile.mkstemp(suffix=".jpg")
            with os.fdopen(fd, 'wb') as tmp:
                tmp.write(screenshot_bytes)
            attachments.append(path)
            body += "<p><em>The screenshot has also been attached to this email.</em></p>"
        except Exception as e:
            print(f"Error creating attachment: {e}")

    body += """
    <p>Regards,</p>
    <p>Your Interview Platform</p>
    """
    
    message = MessageSchema(
        subject=f"Suspicious Activity Detected During Interview {interview_id}",
        recipients=[company_email],
        body=body,
        subtype=MessageType.html,
        attachments=attachments
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    
    # Clean up temp files
    for path in attachments:
        try:
            os.remove(path)
        except Exception as e:
            print(f"Error removing temp file {path}: {e}")


