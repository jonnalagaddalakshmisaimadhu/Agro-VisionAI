
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.services.chatbot import chatbot_service

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint to interact with Farm IQ Assistance.
    """
    try:
        # Convert Pydantic models to list of dicts for service
        history_dict = [{"role": msg.role, "content": msg.content} for msg in request.history]
        
        response = await chatbot_service.get_response(request.message, history_dict)
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
