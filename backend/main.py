from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import random
import string
from datetime import datetime, timedelta
import google.generativeai as genai
import os
from dotenv import load_dotenv
from fastapi import UploadFile, File
import PyPDF2
import docx
import io
from backend import crud, model, schemas, auth
from backend.database import SessionLocal, engine

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Add your frontend URL here
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

@app.post("/generate-questions")
async def generate_questions(request: schemas.InterviewRequest):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    Generate 5 interview questions for a {request.role} candidate applying for a {request.position} position.
    The candidate has experience with the following languages and tools: {request.languages}.
    Other relevant information: {request.other}.

    The questions should be of varying difficulty, appropriate for a {request.role} level.
    Return the questions as a JSON array of strings.
    if its smaller postion ask simple techinal question like what this function if its for higher post ask question from system design and scalabilty  
    """

    try:
        response = model.generate_content(prompt)
        # The response text might be in a markdown format, so we need to clean it
        import json
        # A common way to get the json is to find the first ```json and the last ```
        text_response = response.text
        json_part = text_response[text_response.find('```json\n') + 7 : text_response.rfind('\n```')]
        questions = json.loads(json_part)
        return questions
    except Exception as e:
        print(f"Error generating questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate questions")

@app.post("/evaluate-answers")
async def evaluate_answers(request: schemas.EvaluateRequest):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    Evaluate the following interview answers based on the questions.
    Provide a score from 1 to 10 for each answer, where 1 is poor and 10 is excellent.
    Also provide a brief feedback for each answer.
    Return the result as a JSON array of objects, where each object has "score" and "feedback" properties.

    Questions:
    {request.questions}

    Answers:
    {request.answers}
    """

    try:
        response = model.generate_content(prompt)
        import json
        text_response = response.text
        json_part = text_response[text_response.find('```json\n') + 7 : text_response.rfind('\n```')]
        evaluation = json.loads(json_part)
        return evaluation
    except Exception as e:
        print(f"Error evaluating answers: {e}")
        raise HTTPException(status_code=500, detail="Failed to evaluate answers")

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


def extract_text_from_pdf(file_content):
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return None

def extract_text_from_docx(file_content):
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return None

@app.post("/analyze-cv")
async def analyze_cv(cv: UploadFile = File(...)):
    """
    Analyze uploaded CV and provide feedback
    """
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    # Check file type
    if cv.content_type not in ["application/pdf", "application/msword", 
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are supported")

    # Check file size (10MB limit)
    file_content = await cv.read()
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    # Extract text based on file type
    cv_text = None
    if cv.content_type == "application/pdf":
        cv_text = extract_text_from_pdf(file_content)
    elif cv.content_type in ["application/msword", 
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        cv_text = extract_text_from_docx(file_content)

    if not cv_text:
        raise HTTPException(status_code=400, detail="Could not extract text from CV")

    # Analyze CV using Gemini
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    Analyze the following CV and provide detailed feedback. Return your analysis as a JSON object with the following structure:

    {{
        "overall_score": <float between 1-10>,
        "overall_feedback": "<brief overall assessment>",
        "relevant_points": ["<point 1>", "<point 2>", ...],
        "irrelevant_points": ["<point 1>", "<point 2>", ...],
        "languages": [
            {{
                "name": "<language/technology name>",
                "proficiency": "<Beginner/Intermediate/Advanced/Expert>",
                "feedback": "<specific feedback>"
            }}
        ],
        "industry_standards": {{
            "meeting": ["<standard 1>", "<standard 2>", ...],
            "not_meeting": ["<standard 1>", "<standard 2>", ...]
        }},
        "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
    }}

    Focus on:
    1. Relevant vs irrelevant information for tech roles
    2. Language/technology proficiency levels
    3. Industry-standard formatting and content
    4. What should be added, removed, or improved
    5. Specific, actionable recommendations

    CV Content:
    {cv_text}
    """

    try:
        response = model.generate_content(prompt)
        import json
        text_response = response.text
        
        # Extract JSON from markdown if present
        if '```json' in text_response:
            json_part = text_response[text_response.find('```json\n') + 7 : text_response.rfind('\n```')]
        else:
            json_part = text_response
        
        analysis = json.loads(json_part)
        return analysis
    except Exception as e:
        print(f"Error analyzing CV: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze CV: {str(e)}")
