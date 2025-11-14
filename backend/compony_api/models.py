from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from backend.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    company_name = Column(String, index=True)
    hashed_password = Column(String)
    is_verified = Column(Boolean, default=False)

    interviews = relationship("Interview", back_populates="company")

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_email = Column(String, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    interview_id = Column(String, unique=True, index=True)
    questions = Column(JSON)

    company = relationship("Company", back_populates="interviews")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(String, ForeignKey("interviews.interview_id"), unique=True)
    answers = Column(JSON)

    interview = relationship("Interview", back_populates="answers")

Interview.answers = relationship("Answer", uselist=False, back_populates="interview")
