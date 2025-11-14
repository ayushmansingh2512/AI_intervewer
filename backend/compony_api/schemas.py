from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List

class CompanyCreate(BaseModel):
    email: EmailStr
    company_name: str
    password: Optional[str] = None

class CompanyLogin(BaseModel):
    email: EmailStr
    password: str

class Company(BaseModel):
    id: int
    email: EmailStr
    company_name: str
    is_verified: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str
    
    @validator('otp')
    def validate_otp(cls, v):
        if not v.isdigit() or len(v) != 6:
            raise ValueError('OTP must be 6 digits')
        return v

class InterviewCreate(BaseModel):
    candidate_email: EmailStr
    questions: List[str]

class Interview(BaseModel):
    id: int
    candidate_email: EmailStr
    company_id: int
    interview_id: str

    class Config:
        from_attributes = True

class AnswerCreate(BaseModel):
    answers: List[str]
