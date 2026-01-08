from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.compony_api import crud, schemas
from backend.database import get_db
from backend.auth import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, verify_password, get_password_hash, send_otp_email, send_email_via_sendgrid
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
    current_year = datetime.now().year
    
    duration_html = ""
    if duration_minutes:
        hours = duration_minutes // 60
        minutes = duration_minutes % 60
        duration_str = f"{hours}h {minutes}m" if minutes else f"{hours}h"
        duration_html = f'<p style="margin: 5px 0;"><strong>⏳ Duration:</strong> {duration_str}</p>'

    time_display = scheduled_time if scheduled_time else "Immediate Start"
    
    body = f"""
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #1A1817; padding: 30px; text-align: center;">
           <h1 style="color: #D4A574; margin: 0; font-size: 28px; letter-spacing: 2px; font-weight: 300;">NOODLE LAB</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px; color: #333333;">
          <h2 style="color: #1A1817; margin-top: 0; font-weight: 400; font-size: 24px;">Interview Invitation</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #555555;">Dear Candidate,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #555555;">You have been invited to an interview with <strong style="color: #1A1817;">{company_name}</strong>. We are verified and powered by Noodle Lab's AI infrastructure.</p>
          
          <!-- Schedule Box -->
          <div style="background-color: #f9f9f9; border-left: 4px solid #D4A574; padding: 20px; margin: 25px 0; border-radius: 4px;">
             <p style="margin: 5px 0; font-size: 16px;"><strong>📅 Scheduled Time:</strong> {time_display}</p>
             {duration_html}
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #555555;">Please prioritize a quiet environment and good internet connection. Click the button below when you are ready to begin.</p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="{interview_link}" style="background-color: #D4A574; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s;">Join Interview</a>
          </div>
          
          <p style="font-size: 13px; color: #888888; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px;">
            <em>Note: The interview link is unique to you. Please do not share it with others.</em>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #999999;">
          &copy; {current_year} Noodle Lab. All rights reserved.
        </div>
      </div>
    </div>
    """
    
    await send_email_via_sendgrid(
        to_email=email,
        subject=f"Interview Invitation: {company_name}",
        html_content=body
    )

async def send_suspicious_activity_email(company_email: str, candidate_email: str, interview_id: str, reason: str, screenshot_bytes: bytes = None):
    import base64
    
    current_year = datetime.now().year
    
    screenshot_html = ""
    if screenshot_bytes:
        try:
            screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            screenshot_html = f"""
            <div style="margin-top: 25px; text-align: center;">
                <p style="font-weight: bold; color: #1A1817; margin-bottom: 10px;">Screenshot at time of detection:</p>
                <img src="data:image/jpeg;base64,{screenshot_base64}" alt="Suspicious Activity Screenshot" style="max-width: 100%; border: 3px solid #e74c3c; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"/>
                <p style="font-size: 12px; color: #888888; margin-top: 5px;">(Image also attached)</p>
            </div>
            """
        except Exception as e:
            print(f"Error encoding screenshot: {e}")
            screenshot_html = f"<p style='color: red; font-size: 12px;'>Error loading screenshot preview: {e}</p>"

    body = f"""
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 5px solid #e74c3c;">
        
        <!-- Header -->
        <div style="background-color: #1A1817; padding: 25px; text-align: center;">
           <h1 style="color: #D4A574; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 300;">NOODLE LAB</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px; color: #333333;">
          <h2 style="color: #e74c3c; margin-top: 0; font-weight: 600; font-size: 22px; display: flex; align-items: center;">
            ⚠️ Suspicious Activity Detected
          </h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 20px;">
            Our AI validation system flagged a potential integrity issue during an active interview session.
          </p>

          <!-- Warning Box -->
          <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0; color: #c53030; font-weight: bold; font-size: 16px;">Reason: {reason}</p>
          </div>
          
          <!-- Details -->
          <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; border-left: 3px solid #1A1817;">
             <p style="margin: 5px 0; font-size: 14px;"><strong>👤 Candidate:</strong> {candidate_email}</p>
             <p style="margin: 5px 0; font-size: 14px;"><strong>🆔 Interview ID:</strong> {interview_id}</p>
          </div>

          {screenshot_html}

          <p style="font-size: 14px; line-height: 1.6; color: #555555; margin-top: 30px;">
             We recommend reviewing the full interview recording for further verification.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #999999;">
          &copy; {current_year} Noodle Lab Safety System.
        </div>
      </div>
    </div>
    """
    
    await send_email_via_sendgrid(
        to_email=company_email,
        subject=f"⚠️ Alert: Suspicious Activity - {candidate_email}",
        html_content=body
    )


