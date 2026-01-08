

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from dotenv import load_dotenv
import os
import asyncio
import google.generativeai as genai

# Load env vars immediately
load_dotenv()

from backend import model, schemas
from backend.database import engine

from backend.api.signup import signup
from backend.api.verify_otp import verify_otp
from backend.api.getting_started import getting_started
from backend.api.login import login
from backend.api.auth_google import auth_google
from backend.api.auth_google_callback import auth_google_callback
from backend.api.generate_questions import generate_questions
from backend.api.evaluate_answers import evaluate_answers
from backend.api.generate_voice_interview_questions import generate_voice_interview_questions
from backend.api.process_voice_answer import process_voice_answer
from backend.api.evaluate_voice_interview import evaluate_voice_interview
from backend.api.analyze_cv import analyze_cv
from backend.api.startup_cleanup import startup_cleanup
from backend.api import users as users_router
from backend.api import roadmap as roadmap_router
from backend.compony_api import main as company_api_router
from backend.compony_api import models as company_models

gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

app = FastAPI()

from fastapi import Response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"], # Add your frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
@app.on_event("startup")
async def startup():
    await asyncio.sleep(5) # Add a delay to allow the database to stabilize
    try:
        model.Base.metadata.create_all(bind=engine)
        company_models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("An error occurred during database initialization:")
        print(e)
    await startup_cleanup()

# Include the new users router
app.include_router(users_router.router, prefix="/users", tags=["users"])
app.include_router(roadmap_router.router, prefix="/roadmap", tags=["roadmap"])
app.include_router(company_api_router.router, prefix="/company", tags=["company"])
from backend.compony_api import tts_routes
app.include_router(tts_routes.router, tags=["tts"])

# <------------------- AUTH ENDPOINTS ------------------->

app.post("/signup")(signup)
app.post("/verify-otp")(verify_otp)
app.post("/getting-started", response_model=schemas.Token)(getting_started)
app.post("/login", response_model=schemas.Token)(login)
app.get("/auth/google")(auth_google)
app.get("/auth/google/callback")(auth_google_callback)

# <------------------- TEXT-BASED INTERVIEW ------------------->

app.post("/generate-questions")(generate_questions)
app.post("/evaluate-answers")(evaluate_answers)

# ==================== VOICE INTERVIEW ====================

app.post("/generate-voice-interview-questions")(generate_voice_interview_questions)
app.post("/process-voice-answer", response_model=schemas.VoiceAnswerResponse)(process_voice_answer)
app.post("/evaluate-voice-interview", response_model=schemas.VoiceInterviewEvaluationResponse)(evaluate_voice_interview)

# ==================== CV ANALYSIS ====================

app.post("/analyze-cv")(analyze_cv)
