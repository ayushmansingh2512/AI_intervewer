from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import random
import string
from datetime import datetime, timedelta
import google.generativeai as genai
import os
from dotenv import load_dotenv
import PyPDF2
import docx
import io
import json
import speech_recognition as sr
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from pydub import AudioSegment  

from backend import crud, model, schemas, auth
from backend.database import SessionLocal, engine

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# In-memory storage for OTPs and verified emails
otp_storage = {}
verified_emails = {}

OTP_EXPIRY_MINUTES = 5

# ==================== AUTH ENDPOINTS ====================

@app.post("/signup")
async def signup(email_data: schemas.EmailRequest, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=email_data.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    otp = ''.join(random.choices(string.digits, k=6))
    otp_storage[email_data.email] = {
        "otp": otp,
        "timestamp": datetime.utcnow()
    }
    
    await auth.send_otp_email(email_data.email, otp)
    
    return {"message": "OTP sent to your email"}

@app.post("/verify-otp")
def verify_otp(otp_data: schemas.OTPVerify):
    stored_data = otp_storage.get(otp_data.email)
    if not stored_data:
        raise HTTPException(status_code=400, detail="No OTP found for this email")
    
    time_diff = datetime.utcnow() - stored_data["timestamp"]
    if time_diff > timedelta(minutes=OTP_EXPIRY_MINUTES):
        del otp_storage[otp_data.email]
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    if stored_data["otp"] != otp_data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    verified_emails[otp_data.email] = datetime.utcnow()
    del otp_storage[otp_data.email]
    
    return {"message": "OTP verified successfully"}

@app.post("/getting-started", response_model=schemas.Token)
def getting_started(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.email not in verified_emails:
        raise HTTPException(
            status_code=400, 
            detail="Email not verified. Please complete OTP verification first"
        )
    
    time_diff = datetime.utcnow() - verified_emails[user.email]
    if time_diff > timedelta(minutes=30):
        del verified_emails[user.email]
        raise HTTPException(
            status_code=400,
            detail="Email verification expired. Please verify again"
        )
    
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    crud.create_user(db=db, user=user)
    del verified_emails[user.email]
    
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
    
    if db_user.is_google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please use Google Sign-In for this account",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
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

# ==================== TEXT-BASED INTERVIEW ====================

@app.post("/generate-questions")
async def generate_questions(request: schemas.InterviewRequest):
    """Generate interview questions for text-based interview"""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    Generate {request.numberOfQuestions} interview questions for a {request.role} candidate applying for a {request.position} position.
    
    Question Type Focus: {request.questionType}
    - If 'coding': Focus on practical coding problems and implementation questions
    - If 'dsa': Focus on data structures and algorithms
    - If 'system-design': Focus on architecture, scalability, and design patterns
    - If 'behavioral': Focus on past experiences, teamwork, and soft skills
    - If 'theoretical': Focus on concepts, definitions, and theoretical knowledge
    - If 'mixed': Include a variety of all question types
    
    The candidate has experience with: {request.languages}.
    Additional context: {request.other}.
    
    The questions should be appropriate for a {request.role} level.
    Return the questions as a JSON array of strings.
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text
        
        if '```json' in text_response:
            json_start = text_response.find('```json') + 7
            json_end = text_response.find('```', json_start)
            json_str = text_response[json_start:json_end].strip()
        else:
            json_str = text_response
        
        questions = json.loads(json_str)
        return questions
    except Exception as e:
        print(f"Error generating questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate questions")

@app.post("/evaluate-answers")
async def evaluate_answers(request: schemas.EvaluateRequest):
    """Evaluate text-based interview answers"""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')

    # Format questions and answers for prompt
    qa_pairs = "\n\n".join([
        f"Q{i+1}: {q}\nA{i+1}: {a}" 
        for i, (q, a) in enumerate(zip(request.questions, request.answers))
    ])

    prompt = f"""
    Evaluate the following interview answers based on the questions.
    Provide a score from 1 to 10 for each answer, where 1 is poor and 10 is excellent.
    Also provide a brief feedback for each answer.
    Return the result as a JSON array of objects, where each object has "score" and "feedback" properties.

    {qa_pairs}
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text
        
        if '```json' in text_response:
            json_start = text_response.find('```json') + 7
            json_end = text_response.find('```', json_start)
            json_str = text_response[json_start:json_end].strip()
        else:
            json_str = text_response
        
        evaluation = json.loads(json_str)
        return evaluation
    except Exception as e:
        print(f"Error evaluating answers: {e}")
        raise HTTPException(status_code=500, detail="Failed to evaluate answers")

# ==================== VOICE INTERVIEW ====================

@app.post("/generate-voice-interview-questions")
async def generate_voice_interview_questions(request: schemas.InterviewRequest):
    """Generate voice-optimized interview questions"""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    Generate {request.numberOfQuestions} concise interview questions for a {request.role} candidate applying for a {request.position} position.
    
    Question Type Focus: {request.questionType}
    - If 'coding': Focus on practical coding problems and implementation questions
    - If 'dsa': Focus on data structures and algorithms
    - If 'system-design': Focus on architecture, scalability, and design patterns
    - If 'behavioral': Focus on past experiences, teamwork, and soft skills
    - If 'theoretical': Focus on concepts, definitions, and theoretical knowledge
    - If 'mixed': Include a variety of all question types
    
    The candidate has experience with: {request.languages}.
    Additional context: {request.other}.
    
    The questions should be:
    - Appropriate for a {request.role} level
    - Concise and suitable for voice interviews (not too long)
    - Open-ended to allow detailed responses
    
    Return the questions as a JSON array of strings.
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text
        
        if '```json' in text_response:
            json_start = text_response.find('```json') + 7
            json_end = text_response.find('```', json_start)
            json_str = text_response[json_start:json_end].strip()
        else:
            json_str = text_response
        
        questions = json.loads(json_str)
        return questions
    except Exception as e:
        print(f"Error generating voice interview questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate voice interview questions")



def transcribe_audio(audio_file_content: bytes) -> str:
    """Transcribe audio using speech_recognition library"""
    try:
        recognizer = sr.Recognizer()
        
        # Convert webm to wav using pydub
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_file_content), format="webm")
        wav_file = io.BytesIO()
        audio_segment.export(wav_file, format="wav")
        wav_file.seek(0) # Rewind to the beginning of the file
        
        with sr.AudioFile(wav_file) as source:
            audio = recognizer.record(source)
        
        text = recognizer.recognize_google(audio)
        return text
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return "Unable to transcribe audio. Please check audio quality."
        
@app.post("/process-voice-answer", response_model=schemas.VoiceAnswerResponse)
async def process_voice_answer(
    audio_file: UploadFile = File(...),
    question: str = Form(...),
    current_question_index: int = Form(...),
    total_questions: int = Form(...)
):
    """Process voice answer: transcribe and evaluate"""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        audio_content = await audio_file.read()
        transcribed_text = transcribe_audio(audio_content)
        
        if not transcribed_text:
            transcribed_text = "Audio received but could not be transcribed."
        
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-2.5-flash')

        print(f"current_question_index: {current_question_index}, total_questions: {total_questions}")

        # KEY FIX: Only generate follow-up if NOT on the last question
        follow_up_instruction = ""
        if current_question_index + 1 < total_questions:
            follow_up_instruction = "Also, generate a concise, relevant follow-up question based on the provided answer and the original question. If no further follow-up is logical or necessary, return null for 'follow_up_question'."
        else:
            follow_up_instruction = "Set 'follow_up_question' to null as this is the final question."
        
        print(f"follow_up_instruction: {follow_up_instruction}")
        
        eval_prompt = f"""Evaluate the following interview answer concisely.
        Provide a score from 1 to 10 and brief feedback.
        {follow_up_instruction}
        Return as JSON with "score" (float), "feedback" (string), and "follow_up_question" (string or null) fields.
        IMPORTANT: Do NOT ask for repetition or clarification. If the answer is unclear, provide feedback on clarity and either generate a simple, general follow-up or set 'follow_up_question' to null if no meaningful follow-up can be derived.

        Question: {question}
        Answer: {transcribed_text}

        Consider: clarity, relevance, depth, and confidence level.
        """
        
        response = model.generate_content(eval_prompt)
        text_response = response.text
        print(f"Gemini raw response: {text_response}")
        
        if '```json' in text_response:
            json_start = text_response.find('```json') + 7
            json_end = text_response.find('```', json_start)
            json_str = text_response[json_start:json_end].strip()
        else:
            json_str = text_response

        evaluation = json.loads(json_str)
        print(f"Parsed evaluation: {evaluation}")

        return schemas.VoiceAnswerResponse(
            transcribed_text=transcribed_text,
            score=float(evaluation.get("score", 5.0)),
            feedback=evaluation.get("feedback", "No specific feedback provided."),
            follow_up_question=evaluation.get("follow_up_question", None)
        )
    except Exception as e:
        print(f"Error processing voice answer: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process voice answer: {str(e)}")

@app.post("/evaluate-voice-interview", response_model=schemas.VoiceInterviewEvaluationResponse)
async def evaluate_voice_interview(request: schemas.VoiceInterviewEvaluationRequest):
    """Generate overall evaluation for voice interview"""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        total_score = sum(eval.score for eval in request.evaluations)
        overall_score = total_score / len(request.evaluations) if request.evaluations else 0

        feedback_parts = []
        for i, eval in enumerate(request.evaluations):
            feedback_parts.append(
                f"Q{i+1}: {request.questions[i]}\n"
                f"Score: {eval.score}/10\n"
                f"Feedback: {eval.feedback}\n"
            )
        
        full_feedback = "\n---\n".join(feedback_parts)

        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-2.5-flash')

        overall_prompt = f"""
        Based on the interview performance below, provide:
        1. Overall feedback (2-3 sentences)
        2. 3-5 specific recommendations for improvement
        
        Return as JSON with "overall_feedback" (string) and "recommendations" (array) fields.

        Performance Summary (Overall Score: {overall_score:.1f}/10):
        {full_feedback}
        """

        response = model.generate_content(overall_prompt)
        text_response = response.text
        
        if '```json' in text_response:
            json_start = text_response.find('```json') + 7
            json_end = text_response.find('```', json_start)
            json_str = text_response[json_start:json_end].strip()
        else:
            json_str = text_response
        
        overall_evaluation = json.loads(json_str)

        question_scores = [
            {"name": f"Q{i+1}", "score": float(eval.score)}
            for i, eval in enumerate(request.evaluations)
        ]

        return schemas.VoiceInterviewEvaluationResponse(
            overall_score=round(overall_score, 2),
            overall_feedback=overall_evaluation.get("overall_feedback", "No feedback available."),
            question_scores=question_scores,
            recommendations=overall_evaluation.get("recommendations", [])
        )
    except Exception as e:
        print(f"Error evaluating voice interview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to evaluate: {str(e)}")

# ==================== CV ANALYSIS ====================

def extract_text_from_pdf(file_content: bytes) -> Optional[str]:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text if text.strip() else None
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return None

def extract_text_from_docx(file_content: bytes) -> Optional[str]:
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text if text.strip() else None
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return None

@app.post("/analyze-cv")
async def analyze_cv(cv: UploadFile = File(...)):
    """Analyze uploaded CV and provide detailed feedback"""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    # Validate file type
    if cv.content_type not in ["application/pdf", "application/msword", 
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are supported")

    # Validate file size (10MB limit)
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

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
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
        text_response = response.text
        
        if '```json' in text_response:
            json_start = text_response.find('```json') + 7
            json_end = text_response.find('```', json_start)
            json_str = text_response[json_start:json_end].strip()
        else:
            json_str = text_response
        
        analysis = json.loads(json_str)
        return analysis
    except Exception as e:
        print(f"Error analyzing CV: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze CV: {str(e)}")

# ==================== CLEANUP TASK ====================

@app.on_event("startup")
async def startup_cleanup():
    """Cleanup expired OTPs periodically"""
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