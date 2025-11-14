from sqlalchemy.orm import Session
from backend.compony_api import models, schemas
from backend.auth import get_password_hash
from typing import List

def get_company_by_email(db: Session, email: str):
    return db.query(models.Company).filter(models.Company.email == email).first()

def create_company(db: Session, company: schemas.CompanyCreate):
    hashed_password = None
    if company.password:
        hashed_password = get_password_hash(company.password)
    db_company = models.Company(
        email=company.email,
        company_name=company.company_name,
        hashed_password=hashed_password,
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

def verify_company(db: Session, email: str):
    db_company = get_company_by_email(db, email)
    if db_company:
        db_company.is_verified = True
        db.commit()
    return db_company

def update_company(db: Session, company: schemas.CompanyCreate):
    db_company = get_company_by_email(db, email=company.email)
    if db_company:
        if company.password:
            db_company.hashed_password = get_password_hash(company.password)
        if company.company_name:
            db_company.company_name = company.company_name
        db.commit()
        db.refresh(db_company)
    return db_company

def create_interview(db: Session, interview: schemas.InterviewCreate, company_id: int, interview_id: str):
    db_interview = models.Interview(
        candidate_email=interview.candidate_email,
        company_id=company_id,
        interview_id=interview_id,
        questions=interview.questions,
    )
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    return db_interview

def get_interview_by_interview_id(db: Session, interview_id: str):
    return db.query(models.Interview).filter(models.Interview.interview_id == interview_id).first()

def create_answer(db: Session, interview_id: str, answers: List[str]):
    db_answer = models.Answer(
        interview_id=interview_id,
        answers=answers,
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer

def get_interviews_by_company(db: Session, company_id: int):
    return db.query(models.Interview).filter(models.Interview.company_id == company_id).all()
