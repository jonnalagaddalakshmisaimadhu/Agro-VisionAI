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
        self.model = "qwen/qwen3.8-27b" 
        
        print(f"DEBUG: Chatbot initializing with Groq Key: {self.groq_api_key[:10] if self.groq_api_key else 'MISSING'}...")
        self.client = AsyncGroq(api_key=self.groq_api_key)
        
        self.system_prompt = """
        You are 'Farm IQ Assistance', an intelligent agricultural expert.
        Provide helpful, accurate farming advice in clear markdown format.
        
        CRITICAL INSTRUCTION: If the user asks how to use, access, or utilize a specific feature of the FarmIQ platform, you must explain the proper steps clearly based on their prompt, AND you MUST include a special redirect tag at the very end of your response exactly like this: [REDIRECT: feature-path]
        
        Valid feature-paths are:
        - disease-detection
        - crop-recommendation
        - marketplace
        - weather-alerts
        - equipment-rental
        - expert-consultation
        - government-schemes
        
        For example: If they ask about detecting crop diseases, explain the steps and append [REDIRECT: disease-detection] at the end.
        """

    async def get_response(self, message: str, history: Optional[List[Dict[str, str]]] = None, language: str = "en") -> str:
        LANGUAGE_NAMES = {
            "te": "Telugu (తెలుగు)",
            "hi": "Hindi (हिंदी)",
            "ta": "Tamil (தமிழ்)",
            "bn": "Bengali (বাংলা)",
            "mr": "Marathi (मराठी)",
            "kn": "Kannada (ಕನ್ನಡ)",
            "ml": "Malayalam (മലയാളം)",
            "gu": "Gujarati (ગુજરાતી)",
            "pa": "Punjabi (ਪੰਜਾਬੀ)",
            "or": "Odia (ଓଡ଼ିଆ)",
            "as": "Assamese (অসমীয়া)",
            "ur": "Urdu (اردو)",
            "en": "English",
        }
        target_lang = LANGUAGE_NAMES.get(language, "English")

        system_instruction = self.system_prompt
        if language and language != "en":
            system_instruction += f"\n\nCRITICAL LANGUAGE INSTRUCTION: The user has selected the language: {target_lang}. You MUST reply entirely in {target_lang}. Provide all agricultural advice, explanations, and instructions directly in {target_lang}. However, if you include a redirect tag, keep the format [REDIRECT: feature-path] in English characters exactly as specified."

        messages = [{"role": "system", "content": system_instruction}]
        
        if history:
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": message})
        
        try:
            print(f"DEBUG: Sending request to Groq ({self.model}) in {target_lang}...")
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
