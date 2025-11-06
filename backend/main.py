
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import model, schemas
from backend.database import engine
from dotenv import load_dotenv

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

load_dotenv()
app = FastAPI()

# Add CORS middleware FIRST, before any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
from sqlalchemy import text

@app.on_event("startup")
async def startup_db():
    with engine.connect() as con:
        try:
            con.execute(text("DROP TABLE users CASCADE"))
            con.execute(text("DROP TABLE user_profiles CASCADE"))
            con.execute(text("DROP TABLE mcq_interviews CASCADE"))
        except Exception as e:
            print(f"Warning: Could not drop tables: {e}")
        con.commit()
    model.Base.metadata.create_all(bind=engine)

app.on_event("startup")(startup_cleanup)

# Include the new users router
app.include_router(users_router.router, prefix="/users", tags=["users"])

# <------------------- AUTH ENDPOINTS ------------------->

app.post("/signup")(signup)
app.post("/verify-otp")(verify_otp)
app.post("/getting-started", response_model=schemas.Token)(getting_started)
app.post("/login", response_model=schemas.Token)(login)
app.get("/auth/google")(auth_google)
app.get("/auth/google/callback", response_model=schemas.Token)(auth_google_callback)

# <------------------- TEXT-BASED INTERVIEW ------------------->

app.post("/generate-questions")(generate_questions)
app.post("/evaluate-answers")(evaluate_answers)

# ==================== VOICE INTERVIEW ====================

app.post("/generate-voice-interview-questions")(generate_voice_interview_questions)
app.post("/process-voice-answer", response_model=schemas.VoiceAnswerResponse)(process_voice_answer)
app.post("/evaluate-voice-interview", response_model=schemas.VoiceInterviewEvaluationResponse)(evaluate_voice_interview)

# ==================== CV ANALYSIS ====================

app.post("/analyze-cv")(analyze_cv)
