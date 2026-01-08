from fastapi import APIRouter, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
import re

from backend import schemas
from backend.database import get_db

router = APIRouter()

@router.post("/generate-roadmap")
async def generate_roadmap(request: schemas.RoadmapRequest, db: Session = Depends(get_db)):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    Create a detailed interview preparation roadmap for: '{request.query}'
    
    Return ONLY valid JSON (no markdown, no extra text) with this structure:
    {{
        "title": "Interview Preparation Roadmap: [Goal]",
        "steps": [
            {{
                "title": "Step 1: Foundation",
                "description": "Description here",
                "topics_to_study": ["Topic 1", "Topic 2"],
                "practice_questions": ["Que stion 1", "Question 2"],
                "resources": [
                    {{"name": "Resource Name", "url": "https://example.com"}}
                ]
            }}
        ]
    }}
    
    Include 5-7 comprehensive steps. Ensure all URLs are valid and start with https://. 
    if he ask for some thing like farmer(or any other job leagal or illeagal) you stillgive him a road jut dont gove link that time 
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        # Remove markdown code blocks if present
        json_str = re.sub(r'^```(?:json)?\n?', '', text_response)
        json_str = re.sub(r'\n?```$', '', json_str)
        
        # Try to parse JSON
        roadmap = json.loads(json_str)
        
        # Validate structure
        if not isinstance(roadmap, dict) or 'steps' not in roadmap:
            raise ValueError("Invalid roadmap structure")
        
        return roadmap
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Response was: {text_response[:500]}")
        raise HTTPException(status_code=500, detail=f"Invalid JSON response from API: {str(e)}")
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap: {str(e)}")