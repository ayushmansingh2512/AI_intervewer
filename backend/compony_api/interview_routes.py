from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
import cv2
import numpy as np
import time
from datetime import datetime, timedelta, timezone
from typing import List
import uuid

from backend.compony_api import schemas, models, auth, crud
from backend.database import get_db

router = APIRouter()

# Initialize Gemini
if os.getenv("GEMINI_API_KEY"):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize Face Detection
# Use cv2.data.haarcascades to ensuring loading
face_cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
eye_cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_eye.xml')

face_cascade = cv2.CascadeClassifier(face_cascade_path)
eye_cascade = cv2.CascadeClassifier(eye_cascade_path)

SUSPICIOUS_DURATION_THRESHOLD = 10
EMAIL_COOLDOWN = 60

@router.post("/create-interview", status_code=201)
async def create_interview(
    interview_data: schemas.InterviewCreate,
    db: Session = Depends(get_db),
    current_company: schemas.Company = Depends(auth.get_current_company),
):
    created_count = 0
    # Loop through each candidate email and create a unique interview for them
    for candidate_email in interview_data.candidate_emails:
        interview_id = str(uuid.uuid4())
        
        # Prepare scheduling times
        scheduled_start = None
        if interview_data.scheduled_start_time:
            scheduled_start = datetime.fromisoformat(interview_data.scheduled_start_time.replace("Z", "+00:00"))

        db_interview = models.Interview(
            company_id=current_company.id,
            interview_id=interview_id,
            candidate_email=candidate_email,
            questions=interview_data.questions,
            scheduled_start_time=scheduled_start,
            duration_minutes=interview_data.duration_minutes,
            interview_type=interview_data.interview_type
        )
        
        db.add(db_interview)
        db.commit()
        db.refresh(db_interview)

        interview_link = f"http://localhost:5173/interview/{interview_id}"
        
        # Format time for email
        scheduled_time_str = None
        if scheduled_start:
            try:
                # Convert to IST for display (as per user preference implied in snippet)
                ist_dt = scheduled_start + timedelta(hours=5, minutes=30)
                scheduled_time_str = ist_dt.strftime("%B %d, %Y at %I:%M %p IST")
            except:
                pass
        
        try:
            await auth.send_interview_email(
                email=candidate_email,
                interview_link=interview_link,
                company_name=current_company.company_name,
                scheduled_time=scheduled_time_str,
                duration_minutes=interview_data.duration_minutes
            )
            created_count += 1
        except Exception as e:
            print(f"Failed to send email to {candidate_email}: {e}")

    return {
        "message": f"Interview created and sent to {created_count} candidate(s) successfully"
    }

@router.get("/interviews", response_model=List[schemas.Interview])
def get_interviews(db: Session = Depends(get_db), current_company: schemas.Company = Depends(auth.get_current_company)):
    return db.query(models.Interview).filter(models.Interview.company_id == current_company.id).all()

@router.get("/interview/{interview_id}", response_model=schemas.Interview)
def get_interview(
    interview_id: str,
    db: Session = Depends(get_db)
):
    interview = db.query(models.Interview).filter(models.Interview.interview_id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    # Check for scheduling constraints
    if interview.scheduled_start_time:
        # Use timezone-aware UTC
        now = datetime.now(timezone.utc)
        start_time = interview.scheduled_start_time
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
            
        if now < start_time:
             time_until = start_time - now
             seconds = int(time_until.total_seconds())
             if seconds < 60:
                 time_str = "less than a minute"
             else:
                 time_str = f"{seconds // 3600}h {(seconds // 60) % 60}m"
             raise HTTPException(status_code=403, detail=f"Interview not yet started. Starts in {time_str}")
        
        if interview.duration_minutes:
            end_time = start_time + timedelta(minutes=interview.duration_minutes)
            if now > end_time:
                raise HTTPException(status_code=403, detail="Interview has expired")

    return interview

@router.post("/interview/{interview_id}/submit")
async def submit_interview(
    interview_id: str,
    answers_data: schemas.AnswerCreate,
    db: Session = Depends(get_db)
):
    # 1. Fetch Interview First
    interview = db.query(models.Interview).filter(models.Interview.interview_id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # 2. Evaluate Answers First (Optimized with Gemini Flash)
    print("START_EVALUATION")
    evaluation_result = []
    
    # List of models to try in order of preference
    models_to_try = ['gemini-2.0-flash', 'gemini-2.0-flash-exp']
    
    import time
    
    evaluation_success = False
    
    questions = interview.questions
    answers = answers_data.answers
    
    qa_pairs_str = ""
    for i, (q, a) in enumerate(zip(questions, answers)):
        qa_pairs_str += f"Q{i+1}:{q}\nA{i+1}:{a}\n"
        
    prompt = f"""Evaluate these interview answers. Return ONLY a JSON array of objects with keys 'score' (1-10) and 'feedback' (concise string). No markdown formatting.
    
{qa_pairs_str}"""

    for model_name in models_to_try:
        if evaluation_success:
            break
            
        try:
            print(f"Attempting evaluation with model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            text_response = response.text.strip()
            
            # Cleanup
            if text_response.startswith("```json"):
                text_response = text_response[7:]
            if text_response.endswith("```"):
                text_response = text_response[:-3]
                
            evaluation_result = json.loads(text_response.strip())
            evaluation_success = True
            print("END_EVALUATION")
            
        except Exception as e:
            print(f"Evaluation failed with {model_name}: {e}")
            # If it's a quota error (429), wait a bit before trying the next model
            if "429" in str(e) or "Resource" in str(e):
                print("Quota exceeded, waiting 5 seconds...")
                time.sleep(5)
            continue

    if not evaluation_success:
        print("All valuation attempts failed.")
        # Return empty evaluation structure
        evaluation_result = [{"score": 0, "feedback": "Evaluation unavailable (Quota Limit)"} for _ in answers]

    # 3. Store Answer
    db_answer = db.query(models.Answer).filter(models.Answer.interview_id == interview_id).first()
    
    if db_answer:
        db_answer.answers = answers
        db_answer.evaluation = evaluation_result
        db_answer.submitted_at = datetime.utcnow()
    else:
        new_answer = models.Answer(
            interview_id=interview_id,
            answers=answers,
            evaluation=evaluation_result,
            submitted_at=datetime.utcnow()
        )
        db.add(new_answer)
    
    db.commit()

    return {"message": "Interview submitted and evaluated successfully", "evaluation": evaluation_result}

@router.websocket("/interview/{interview_id}/stream")
async def websocket_endpoint(websocket: WebSocket, interview_id: str, db: Session = Depends(get_db)):
    await websocket.accept()
    
    # Verify interview exists
    interview = db.query(models.Interview).filter(models.Interview.interview_id == interview_id).first()
    if not interview:
        await websocket.close()
        return
        
    # Get company for email
    company = db.query(models.Company).filter(models.Company.id == interview.company_id).first()
    if not company:
        await websocket.close()
        return

    last_face_detection_time = time.time()
    last_email_sent_time = 0
    last_frame = None

    try:
        while True:
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is not None:
                last_frame = frame
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)

                current_time = time.time()

                if len(faces) == 0:
                    # No face detected
                    if current_time - last_face_detection_time > SUSPICIOUS_DURATION_THRESHOLD:
                        if current_time - last_email_sent_time > EMAIL_COOLDOWN:
                            screenshot_bytes = None
                            if last_frame is not None:
                                _, buffer = cv2.imencode('.jpg', last_frame)
                                screenshot_bytes = buffer.tobytes()
                            
                            print(f"No face detected for {interview_id}. Sending alert.")
                            await auth.send_suspicious_activity_email(
                                company_email=company.email,
                                candidate_email=interview.candidate_email,
                                interview_id=interview_id,
                                reason="No face detected for 10 seconds",
                                screenshot_bytes=screenshot_bytes
                            )
                            last_email_sent_time = current_time
                else:
                    # Face detected
                    last_face_detection_time = current_time
                    # Optional: Eye detection logic could go here similar to user snippet
                    
    except WebSocketDisconnect:
        print(f"Client disconnected {interview_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        try:
             await websocket.close()
        except:
             pass

@router.get("/interview-results/{interview_id}", response_model=schemas.InterviewResult)
def get_interview_results(
    interview_id: str,
    db: Session = Depends(get_db),
    current_company: schemas.Company = Depends(auth.get_current_company)
):
    # Verify interview belongs to company
    interview = db.query(models.Interview).filter(
        models.Interview.interview_id == interview_id,
        models.Interview.company_id == current_company.id
    ).first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Fetch answers
    answer_record = db.query(models.Answer).filter(models.Answer.interview_id == interview_id).first()
    
    if not answer_record:
        # Return empty/null result structure if no answers yet, or 404
        raise HTTPException(status_code=404, detail="No results submitted for this interview yet")

    return schemas.InterviewResult(
        candidate_email=interview.candidate_email,
        questions=interview.questions,
        answers=answer_record.answers,
        evaluation=answer_record.evaluation,
        submitted_at=answer_record.submitted_at
    )
