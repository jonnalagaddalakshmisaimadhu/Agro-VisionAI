import os
from groq import Groq
from dotenv import load_dotenv

# Load key from .env
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

print(f"Testing Groq API with key: {api_key[:10]}...")

try:
    client = Groq(api_key=api_key)
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": "Hello, respond with ONLY 'KEY_WORKING'."}],
        model="llama-3.1-8b-instant",
    )
    print("\n✅ RESULT:", chat_completion.choices[0].message.content)
except Exception as e:
    print("\n❌ FAILED:", str(e))
