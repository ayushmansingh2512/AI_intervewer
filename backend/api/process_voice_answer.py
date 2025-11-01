
from fastapi import HTTPException, UploadFile, File, Form
import google.generativeai as genai
import os
import json

from backend import schemas
from backend.api.transcribe_audio import transcribe_audio

async def process_voice_answer(
    audio_file: UploadFile = File(...),
    question: str = Form(...),
    current_question_index: int = Form(...),
    total_questions: int = Form(...)
):
    """Process voice answer: transcribe and evaluate"""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        audio_content = await audio_file.read()
        transcribed_text = transcribe_audio(audio_content)
        
        if not transcribed_text:
            transcribed_text = "Audio received but could not be transcribed."
        
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-2.5-flash')

        print(f"current_question_index: {current_question_index}, total_questions: {total_questions}")

        # KEY FIX: Only generate follow-up if NOT on the last question
        follow_up_instruction = ""
        if current_question_index + 1 < total_questions:
            follow_up_instruction = "Also, generate a concise, relevant follow-up question based on the provided answer and the original question. If no further follow-up is logical or necessary, return null for 'follow_up_question'."
        else:
            follow_up_instruction = "Set 'follow_up_question' to null as this is the final question."
        
        print(f"follow_up_instruction: {follow_up_instruction}")
        
        eval_prompt = f"""Evaluate the following interview answer concisely.
        Provide a score from 1 to 10 and brief feedback.
        {follow_up_instruction}
        Return as JSON with "score" (float), "feedback" (string), and "follow_up_question" (string or null) fields.
        IMPORTANT: Do NOT ask for repetition or clarification. If the answer is unclear, provide feedback on clarity and either generate a simple, general follow-up or set 'follow_up_question' to null if no meaningful follow-up can be derived.

        Question: {question}
        Answer: {transcribed_text}

        Consider: clarity, relevance, depth, and confidence level.
        """
        
        response = model.generate_content(eval_prompt)
        text_response = response.text
        print(f"Gemini raw response: {text_response}")
        
        if '```json' in text_response:
            json_start = text_response.find('```json') + 7
            json_end = text_response.find('```', json_start)
            json_str = text_response[json_start:json_end].strip()
        else:
            json_str = text_response

        evaluation = json.loads(json_str)
        print(f"Parsed evaluation: {evaluation}")

        return schemas.VoiceAnswerResponse(
            transcribed_text=transcribed_text,
            score=float(evaluation.get("score", 5.0)),
            feedback=evaluation.get("feedback", "No specific feedback provided."),
            follow_up_question=evaluation.get("follow_up_question", None)
        )
    except Exception as e:
        print(f"Error processing voice answer: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process voice answer: {str(e)}")
