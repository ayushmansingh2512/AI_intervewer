
from fastapi import HTTPException, UploadFile, File
import google.generativeai as genai
import os
import json

from backend import schemas
from backend.api.cv_parser_utils import extract_text_from_pdf, extract_text_from_docx

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
