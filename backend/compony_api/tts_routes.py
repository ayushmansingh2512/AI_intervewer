from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import Response
from google.cloud import texttospeech
import os

router = APIRouter()

@router.post("/tts")
async def text_to_speech(text: str = Body(..., embed=True)):
    """
    Converts text to speech using Google Cloud Text-to-Speech API.
    Returns audio content as MP3.
    """
    try:
        # Instantiates a client
        client = texttospeech.TextToSpeechClient()

        # Set the text input to be synthesized
        synthesis_input = texttospeech.SynthesisInput(text=text)

        # Build the voice request, select the language code ("en-US") and the ssml
        # voice gender ("neutral")
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="en-US-Journey-D", # High quality journey voice
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )

        # Select the type of audio file you want returned
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        # Perform the text-to-speech request on the text input with the selected
        # voice parameters and audio file type
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # Return the audio content
        return Response(content=response.audio_content, media_type="audio/mpeg")

    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
