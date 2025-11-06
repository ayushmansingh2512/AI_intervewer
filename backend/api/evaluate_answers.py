from fastapi import HTTPException
import google.generativeai as genai
import os
import json

from backend import schemas

async def evaluate_answers(request: schemas.EvaluateRequest):
    """Evaluate text-based interview answers"""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')

    # Format questions and answers for prompt
    qa_pairs = "\n\n".join([
        f"Q{i+1}: {q['question']}\nOptions: {q['options']}\nCorrect Answer: {q['answer']}\nUser's Answer: {a}"
        if isinstance(q, dict) else
        f"Q{i+1}: {q}\nA{i+1}: {a}" 
        for i, (q, a) in enumerate(zip(request.questions, request.answers))
    ])

    prompt = f"""
    Evaluate the following interview answers based on the questions.
    Provide a score from 1 to 10 for each answer, where 1 is poor and 10 is excellent.
    Also provide a brief feedback for each answer.
    Return the result as a JSON array of objects, where each object has "score" and "feedback" properties.

    {qa_pairs}
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
        
        evaluation = json.loads(json_str)
        return evaluation
    except Exception as e:
        print(f"Error evaluating answers: {e}")
        raise HTTPException(status_code=500, detail="Failed to evaluate answers")

