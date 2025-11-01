from fastapi import HTTPException
import google.generativeai as genai
import os
import json

from backend import schemas

async def evaluate_voice_interview(request: schemas.VoiceInterviewEvaluationRequest):
    """Generate overall evaluation for voice interview"""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        total_score = sum(eval.score for eval in request.evaluations)
        overall_score = total_score / len(request.evaluations) if request.evaluations else 0

        feedback_parts = []
        for i, eval in enumerate(request.evaluations):
            feedback_parts.append(
                f"Q{i+1}: {request.questions[i]}\n"
                f"Score: {eval.score}/10\n"
                f"Feedback: {eval.feedback}\n"
            )
        
        full_feedback = "\n---\n".join(feedback_parts)

        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-2.5-flash')

        overall_prompt = f"""
        Based on the interview performance below, provide:
        1. Overall feedback (2-3 sentences)
        2. 3-5 specific recommendations for improvement
        
        Return as JSON with "overall_feedback" (string) and "recommendations" (array) fields.

        Performance Summary (Overall Score: {overall_score:.1f}/10):
        {full_feedback}
        """

        response = model.generate_content(overall_prompt)
        text_response = response.text
        
        if '```json' in text_response:
            json_start = text_response.find('```json') + 7
            json_end = text_response.find('```', json_start)
            json_str = text_response[json_start:json_end].strip()
        else:
            json_str = text_response
        
        overall_evaluation = json.loads(json_str)

        question_scores = [
            {"name": f"Q{i+1}", "score": float(eval.score)}
            for i, eval in enumerate(request.evaluations)
        ]

        return schemas.VoiceInterviewEvaluationResponse(
            overall_score=round(overall_score, 2),
            overall_feedback=overall_evaluation.get("overall_feedback", "No feedback available."),
            question_scores=question_scores,
            recommendations=overall_evaluation.get("recommendations", [])
        )
    except Exception as e:
        print(f"Error evaluating voice interview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to evaluate: {str(e)}")
