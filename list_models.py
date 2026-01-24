import google.generativeai as genai
import os

gemini_key = os.getenv("GEMINI_API_KEY", "AIzaSyDCZs0XudZj7lwsCr4Z4dxjBkzyuo5TaeU")
genai.configure(api_key=gemini_key)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
