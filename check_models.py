import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Try looking in backend/.env if not found in root
    load_dotenv("backend/.env", override=True)
    api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found in environment.")
    exit(1)

print(f"API Key found. Length: {len(api_key)}")
print(f"Key starts with: {api_key[:10]}... ends with: ...{api_key[-5:]}")

genai.configure(api_key=api_key)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
