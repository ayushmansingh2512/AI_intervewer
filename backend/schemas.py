from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Union

class EmailRequest(BaseModel):
    email: EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class User(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_verified: bool
    is_google_user: bool

    class Config:
        orm_mode = True


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
    questionType: str = "mixed"
    numberOfQuestions: int = 5
    
class EvaluateRequest(BaseModel):
    questions: List[Union[str, dict]]
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

class VoiceAnswerRequest(BaseModel):
    question: str

class VoiceAnswerResponse(BaseModel):
    transcribed_text: str
    score: float
    feedback: str
    follow_up_question: Optional[str] = None

class VoiceInterviewEvaluationRequest(BaseModel):
    evaluations: List[VoiceAnswerResponse]
    questions: List[Union[str, dict]]

class VoiceInterviewEvaluationResponse(BaseModel):
    overall_score: float
    overall_feedback: str
    question_scores: List[dict] # e.g., [{"name": "Q1", "score": 7.5}]
    recommendations: List[str]

class RoadmapRequest(BaseModel):
    query: str