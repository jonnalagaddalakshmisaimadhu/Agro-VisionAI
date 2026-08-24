from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.services.llm_provider import generate_reply
from app.core.security import verify_token

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    text: str
    sources: Optional[list] = None


@router.post("/", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    """Simple chat endpoint that returns an AI response. Public for now (no auth) to avoid breaking frontend."""
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message is required")

    # Basic topicality guard: simple keyword check (server-side safety)
    lower = payload.message.lower()
    allowed_keywords = ["crop", "soil", "farming", "irrigation", "pesticide", "disease", "market", "weather", "harvest"]
    if not any(k in lower for k in allowed_keywords):
        return ChatResponse(text="I’m focused on agriculture and AgriTech topics only. Please ask about crops, soil, irrigation, plant health, market prices, or related farming queries.")

    # Generate reply from LLM provider
    reply = await generate_reply(payload.message)
    return ChatResponse(text=reply)
