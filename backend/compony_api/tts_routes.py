from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import Response
from gtts import gTTS
import io

router = APIRouter()

@router.post("/tts")
async def text_to_speech(text: str = Body(..., embed=True)):
    """
    Converts text to speech using gTTS (Google Translate Text-to-Speech).
    Returns audio content as MP3.
    """
    try:
        # Use gTTS to generate audio
        tts = gTTS(text=text, lang='en', tld='com') # tld='com' defaults to US English accent
        
        # Save to BytesIO buffer
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        # Return the audio content
        return Response(content=mp3_fp.read(), media_type="audio/mpeg")

    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
