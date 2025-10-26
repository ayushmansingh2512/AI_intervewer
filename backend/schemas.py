from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List

class EmailRequest(BaseModel):
    email: EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

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

class InterviewRequest(BaseModel):
    role: str
    position: str
    languages: str
    other: str

class EvaluateRequest(BaseModel):
    questions: List[str]
    answers: List[str]


class LanguageAnalysis(BaseModel):
    name: str
    proficiency: str
    feedback: str

class IndustryStandards(BaseModel):
    meeting: List[str]
    not_meeting: List[str]

class CVAnalysis(BaseModel):
    overall_score: float
    overall_feedback: str
    relevant_points: List[str]
    irrelevant_points: List[str]
    languages: List[LanguageAnalysis]
    industry_standards: IndustryStandards
    recommendations: List[str]