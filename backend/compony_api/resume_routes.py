from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
import asyncio

from backend.compony_api import schemas, auth
from backend.api.cv_parser_utils import extract_text_from_pdf, extract_text_from_docx

router = APIRouter()

async def process_resume(resume: UploadFile, job_description: str, model: genai.GenerativeModel):
    file_content = await resume.read()
    if resume.content_type == "application/pdf":
        resume_text = extract_text_from_pdf(file_content)
    elif resume.content_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        resume_text = extract_text_from_docx(file_content)
    else:
        print(f"Unsupported file type: {resume.content_type}")
        return None

    if not resume_text:
        print("Could not extract text from resume")
        return None

    prompt = f"""
    Score the following resume on a scale of 1 to 10 based on how well it matches the job description.
    Also extract the candidate's name and email.
    Provide a brief justification for the score.
    Return the result as a JSON object with "name", "email", "score", and "justification" properties.

    Job Description:
    {job_description}

    Resume:
    {resume_text}
    """

    try:
        print("Generating content with Gemini...")
        response = await model.generate_content_async(prompt)
        text_response = response.text
        print(f"Gemini response: {text_response}")
        
        # Clean the response to extract only the JSON part
        if '```json' in text_response:
            json_start = text_response.find('```json') + 7
            json_end = text_response.find('```', json_start)
            json_str = text_response[json_start:json_end].strip()
        else:
            # Try to find JSON between curly braces
            json_start = text_response.find('{')
            json_end = text_response.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = text_response[json_start:json_end]
            else:
                json_str = text_response

        print(f"Cleaned JSON string: {json_str}")
        analysis = json.loads(json_str)
        return analysis
    except Exception as e:
        print(f"Error processing resume: {e}")
        return None

@router.post("/shortlist-resumes")
async def shortlist_resumes(
    resumes: List[UploadFile] = File(...),
    job_description: str = Form(...),
    current_company: schemas.Company = Depends(auth.get_current_company),
):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')

    tasks = [process_resume(resume, job_description, model) for resume in resumes]
    results = await asyncio.gather(*tasks)
    
    shortlisted_resumes = [res for res in results if res is not None]
    shortlisted_resumes.sort(key=lambda x: x.get("score", 0), reverse=True)
    print(f"Shortlisted resumes: {shortlisted_resumes}")

    return shortlisted_resumes
