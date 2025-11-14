from fastapi import APIRouter, Depends, HTTPException, WebSocket
from sqlalchemy.orm import Session
import uuid
import os
import json
import google.generativeai as genai
import cv2
import numpy as np
from typing import List

from backend.compony_api import crud, schemas, auth
from backend.database import get_db

router = APIRouter()

@router.post("/create-interview", status_code=201)
async def create_interview(
    interview_data: schemas.InterviewCreate,
    db: Session = Depends(get_db),
    current_company: schemas.Company = Depends(auth.get_current_company),
):
    interview_id = str(uuid.uuid4())
    crud.create_interview(
        db=db,
        interview=interview_data,
        company_id=current_company.id,
        interview_id=interview_id,
    )

    interview_link = f"http://localhost:5173/interview/{interview_id}"
    
    await auth.send_interview_email(
        email=interview_data.candidate_email,
        interview_link=interview_link,
        company_name=current_company.company_name,
    )

    return {"message": "Interview created and email sent successfully"}

@router.get("/interviews", response_model=List[schemas.Interview])
def get_interviews(db: Session = Depends(get_db), current_company: schemas.Company = Depends(auth.get_current_company)):
    return crud.get_interviews_by_company(db, company_id=current_company.id)

@router.get("/interview/{interview_id}")
def get_interview(interview_id: str, db: Session = Depends(get_db)):
    db_interview = crud.get_interview_by_interview_id(db, interview_id=interview_id)
    if db_interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    return db_interview

@router.post("/interview/{interview_id}/submit")
def submit_answers(interview_id: str, answer_data: schemas.AnswerCreate, db: Session = Depends(get_db)):
    db_interview = crud.get_interview_by_interview_id(db, interview_id=interview_id)
    if db_interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")

    crud.create_answer(db, interview_id=interview_id, answers=answer_data.answers)

    return {"message": "Answers submitted successfully"}

from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket
from sqlalchemy.orm import Session
import uuid
import os
import json
import google.generativeai as genai
import cv2
import numpy as np
import time

from backend.compony_api import crud, schemas, auth
from backend.database import get_db

router = APIRouter()

@router.post("/create-interview", status_code=201)
async def create_interview(
    interview_data: schemas.InterviewCreate,
    db: Session = Depends(get_db),
    current_company: schemas.Company = Depends(auth.get_current_company),
):
    interview_id = str(uuid.uuid4())
    crud.create_interview(
        db=db,
        interview=interview_data,
        company_id=current_company.id,
        interview_id=interview_id,
    )

    interview_link = f"http://localhost:5173/interview/{interview_id}"
    
    await auth.send_interview_email(
        email=interview_data.candidate_email,
        interview_link=interview_link,
        company_name=current_company.company_name,
    )

    return {"message": "Interview created and email sent successfully"}

@router.get("/interviews", response_model=List[schemas.Interview])
def get_interviews(db: Session = Depends(get_db), current_company: schemas.Company = Depends(auth.get_current_company)):
    return crud.get_interviews_by_company(db, company_id=current_company.id)

@router.get("/interview/{interview_id}")
def get_interview(interview_id: str, db: Session = Depends(get_db)):
    db_interview = crud.get_interview_by_interview_id(db, interview_id=interview_id)
    if db_interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    return db_interview

@router.post("/interview/{interview_id}/submit")
def submit_answers(interview_id: str, answer_data: schemas.AnswerCreate, db: Session = Depends(get_db)):
    db_interview = crud.get_interview_by_interview_id(db, interview_id=interview_id)
    if db_interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")

    crud.create_answer(db, interview_id=interview_id, answers=answer_data.answers)

    return {"message": "Answers submitted successfully"}

face_cascade = cv2.CascadeClassifier('backend/haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier('backend/haarcascade_eye.xml')

SUSPICIOUS_DURATION_THRESHOLD = 5 # seconds
EMAIL_COOLDOWN = 60 # seconds

@router.websocket("/interview/{interview_id}/stream")
async def stream(websocket: WebSocket, interview_id: str, db: Session = Depends(get_db)):
    await websocket.accept()
    
    db_interview = crud.get_interview_by_interview_id(db, interview_id=interview_id)
    if db_interview is None:
        print(f"Interview {interview_id} not found for WebSocket stream.")
        await websocket.close()
        return
    
    db_company = crud.get_company_by_email(db, email=db_interview.company.email)
    if db_company is None:
        print(f"Company for interview {interview_id} not found for WebSocket stream.")
        await websocket.close()
        return

    last_face_detection_time = time.time()
    last_eyes_detection_time = time.time()
    last_email_sent_time = 0

    try:
        while True:
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is not None:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)

                current_time = time.time()

                if len(faces) == 0:
                    print("No face detected")
                    if current_time - last_face_detection_time > SUSPICIOUS_DURATION_THRESHOLD:
                        if current_time - last_email_sent_time > EMAIL_COOLDOWN:
                            await auth.send_suspicious_activity_email(
                                company_email=db_company.email,
                                candidate_email=db_interview.candidate_email,
                                interview_id=interview_id,
                                reason="No face detected"
                            )
                            last_email_sent_time = current_time
                else:
                    last_face_detection_time = current_time
                    for (x, y, w, h) in faces:
                        roi_gray = gray[y:y+h, x:x+w]
                        eyes = eye_cascade.detectMultiScale(roi_gray)
                        if len(eyes) == 0:
                            print("No eyes detected")
                            if current_time - last_eyes_detection_time > SUSPICIOUS_DURATION_THRESHOLD:
                                if current_time - last_email_sent_time > EMAIL_COOLDOWN:
                                    await auth.send_suspicious_activity_email(
                                        company_email=db_company.email,
                                        candidate_email=db_interview.candidate_email,
                                        interview_id=interview_id,
                                        reason="No eyes detected"
                                    )
                                    last_email_sent_time = current_time
                        else:
                            last_eyes_detection_time = current_time
                            print(f"{len(eyes)} eyes detected")

            else:
                print(f"Could not decode frame for interview {interview_id}")

    except Exception as e:
        print(f"Error in WebSocket connection: {e}")
    finally:
        await websocket.close()

@router.get("/interview-results/{interview_id}")
async def get_interview_results(interview_id: str, db: Session = Depends(get_db), current_company: schemas.Company = Depends(auth.get_current_company)):
    print(f"Fetching results for interview ID: {interview_id}")
    db_interview = crud.get_interview_by_interview_id(db, interview_id=interview_id)
    if db_interview is None:
        print("Interview not found in database")
        raise HTTPException(status_code=404, detail="Interview not found")

    print(f"Interview found: {db_interview}")
    if db_interview.company_id != current_company.id:
        print("Company ID mismatch")
        raise HTTPException(status_code=403, detail="Not authorized to view this interview")

    print(f"Answers: {db_interview.answers}")
    if not db_interview.answers:
        print("Answers not found for this interview")
        raise HTTPException(status_code=404, detail="Answers not submitted yet")

    questions = db_interview.questions
    answers = db_interview.answers.answers

    # Evaluate the answers
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')

    evaluation = []
    for i in range(len(questions)):
        prompt = f"""
        Score the following answer on a scale of 1 to 10 based on how well it answers the question.
        Also provide feedback on the answer.
        Return the result as a JSON object with "score" and "feedback" properties.

        Question:
        {questions[i]}

        Answer:
        {answers[i]}
        """

        try:
            response = model.generate_content(prompt)
            text_response = response.text
            
            if '```json' in text_response:
                json_start = text_response.find('```json') + 7
                json_end = text_response.find('```', json_start)
                json_str = text_response[json_start:json_end].strip()
            else:
                json_start = text_response.find('{')
                json_end = text_response.rfind('}') + 1
                if json_start != -1 and json_end != -1:
                    json_str = text_response[json_start:json_end]
                else:
                    json_str = text_response
            
            analysis = json.loads(json_str)
            evaluation.append(analysis)
        except Exception as e:
            print(f"Error processing answer: {e}")
            evaluation.append({"score": 0, "feedback": "Error evaluating answer."})
            continue

    return {
        "questions": questions,
        "answers": answers,
        "evaluation": evaluation,
    }

@router.get("/interview-results/{interview_id}")
async def get_interview_results(interview_id: str, db: Session = Depends(get_db), current_company: schemas.Company = Depends(auth.get_current_company)):
    print(f"Fetching results for interview ID: {interview_id}")
    db_interview = crud.get_interview_by_interview_id(db, interview_id=interview_id)
    if db_interview is None:
        print("Interview not found in database")
        raise HTTPException(status_code=404, detail="Interview not found")

    print(f"Interview found: {db_interview}")
    if db_interview.company_id != current_company.id:
        print("Company ID mismatch")
        raise HTTPException(status_code=403, detail="Not authorized to view this interview")

    print(f"Answers: {db_interview.answers}")
    if not db_interview.answers:
        print("Answers not found for this interview")
        raise HTTPException(status_code=404, detail="Answers not submitted yet")

    questions = db_interview.questions
    answers = db_interview.answers.answers

    # Evaluate the answers
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')

    evaluation = []
    for i in range(len(questions)):
        prompt = f"""
        Score the following answer on a scale of 1 to 10 based on how well it answers the question.
        Also provide feedback on the answer.
        Return the result as a JSON object with "score" and "feedback" properties.

        Question:
        {questions[i]}

        Answer:
        {answers[i]}
        """

        try:
            response = model.generate_content(prompt)
            text_response = response.text
            
            if '```json' in text_response:
                json_start = text_response.find('```json') + 7
                json_end = text_response.find('```', json_start)
                json_str = text_response[json_start:json_end].strip()
            else:
                json_start = text_response.find('{')
                json_end = text_response.rfind('}') + 1
                if json_start != -1 and json_end != -1:
                    json_str = text_response[json_start:json_end]
                else:
                    json_str = text_response
            
            analysis = json.loads(json_str)
            evaluation.append(analysis)
        except Exception as e:
            print(f"Error processing answer: {e}")
            evaluation.append({"score": 0, "feedback": "Error evaluating answer."})
            continue

    return {
        "questions": questions,
        "answers": answers,
        "evaluation": evaluation,
    }
