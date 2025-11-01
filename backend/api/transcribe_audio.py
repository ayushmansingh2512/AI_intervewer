
import speech_recognition as sr
from pydub import AudioSegment
import io

def transcribe_audio(audio_file_content: bytes) -> str:
    """Transcribe audio using speech_recognition library"""
    try:
        recognizer = sr.Recognizer()
        
        # Convert webm to wav using pydub
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_file_content), format="webm")
        wav_file = io.BytesIO()
        audio_segment.export(wav_file, format="wav")
        wav_file.seek(0) # Rewind to the beginning of the file
        
        with sr.AudioFile(wav_file) as source:
            audio = recognizer.record(source)
        
        text = recognizer.recognize_google(audio)
        return text
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return "Unable to transcribe audio. Please check audio quality."
