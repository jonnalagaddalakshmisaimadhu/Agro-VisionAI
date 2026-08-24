import os
import json
import asyncio
from groq import AsyncGroq
from typing import List, Dict, Optional

class ChatbotService:
    def __init__(self):
        # FORCE load from .env
        from dotenv import load_dotenv
        load_dotenv()
        
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.model = "llama-3.1-8b-instant" 
        
        print(f"DEBUG: Chatbot initializing with Groq Key: {self.groq_api_key[:10] if self.groq_api_key else 'MISSING'}...")
        self.client = AsyncGroq(api_key=self.groq_api_key)
        
        self.system_prompt = """
        You are 'Farm IQ Assistance', an intelligent agricultural expert.
        Provide helpful, accurate farming advice.
        """

    async def get_response(self, message: str, history: Optional[List[Dict[str, str]]] = None) -> str:
        messages = [{"role": "system", "content": self.system_prompt}]
        
        if history:
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": message})
        
        try:
            print(f"DEBUG: Sending request to Groq ({self.model})...")
            completion = await self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=0.7,
                max_tokens=1024,
            )
            return completion.choices[0].message.content
        except Exception as e:
            error_text = str(e)
            print(f"GROQ API ERROR: {error_text}")
            return f"Chatbot Error: {error_text[:100]}"

chatbot_service = ChatbotService()
