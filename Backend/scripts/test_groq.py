import os
from groq import Groq
from dotenv import load_dotenv

# Load key from Backend/.env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("❌ ERROR: GROQ_API_KEY not found in .env")
    exit(1)

print(f"Testing Groq API with key: {api_key[:10]}...")

try:
    client = Groq(api_key=api_key)
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": "Hello, this is a test from Agro-VisionAI."}],
        model="llama3-70b-8192",
    )
    print("\n✅ RESULT:", chat_completion.choices[0].message.content)
except Exception as e:
    print("\n❌ FAILED:", str(e))
