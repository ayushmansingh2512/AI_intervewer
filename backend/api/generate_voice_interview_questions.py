
from fastapi import HTTPException
import google.generativeai as genai
import os
import json

from backend import schemas

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
