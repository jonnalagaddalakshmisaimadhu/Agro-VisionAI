from typing import Optional, Dict, Any
import os
import openai
from fastapi import HTTPException
from starlette.concurrency import run_in_threadpool

# Read API key from env var
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

SYSTEM_INSTRUCTION = (
    "You are 'FarmIQ', a specialized AI chatbot assistant. Your sole purpose is to provide "
    "clear, accurate, and in-depth answers exclusively to questions about agriculture and "
    "agricultural technology (AgriTech). Provide concise, actionable guidance and ask clarifying "
    "questions when required. For chemical, machinery, or financial decisions, remind users to "
    "consult local experts and follow safety guidelines."
)


def _call_openai_completion(prompt: str, model: str = "gpt-4o-mini") -> Dict[str, Any]:
    # Wrapper for synchronous OpenAI call
    try:
        resp = openai.ChatCompletion.create(
            model=model,
            messages=[{"role": "system", "content": SYSTEM_INSTRUCTION}, {"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.2,
        )
        return resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM provider error: {e}")


async def generate_reply(prompt: str, model: Optional[str] = None) -> str:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured on server")

    use_model = model or os.getenv("CHATBOT_MODEL") or "gpt-4o-mini"

    # call blocking code in threadpool
    resp = await run_in_threadpool(_call_openai_completion, prompt, use_model)
    try:
        text = resp["choices"][0]["message"]["content"]
        return text
    except Exception:
        raise HTTPException(status_code=500, detail="Unexpected response from LLM provider")
