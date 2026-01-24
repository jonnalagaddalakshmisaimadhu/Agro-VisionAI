
import os
import json
from groq import Groq
from typing import List, Dict, Optional
from app.services.weather import weather_service

class ChatbotService:
    def __init__(self):
        # Initialize API keys from settings first, then fall back to env
        from app.core.config import settings
        self.groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "YOUR_API_KEY_HERE")
        self.gemini_api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        
        self.use_gemini = False
        
        # Determine which AI provider to use
        if self.groq_api_key and self.groq_api_key != "YOUR_API_KEY_HERE":
            print(f"DEBUG: Initializing Groq Chatbot with key starting with: {self.groq_api_key[:8]}...")
            self.client = Groq(api_key=self.groq_api_key)
        elif self.gemini_api_key:
            print("DEBUG: Groq API key not found or default, switching to Gemini for Chatbot.")
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
            self.use_gemini = True
        else:
            print("WARNING: Neither Groq nor Gemini API keys found for Chatbot.")
            # We'll still try to initialize Groq to avoid attribute errors if a key is provided later via env
            self.client = Groq(api_key=self.groq_api_key)
        
        self.system_prompt = """
        You are 'Farm IQ Assistance', an intelligent agricultural expert.
        
        Your Mission:
        - Provide accurate, scientific, and helpful information about agriculture.
        - Assist users with crop management, soil health, and pest control.
        - **WEATHER REPORTING:** Use real-time data provided in systemic injections to give detailed advisories.
        
        FORMATTING RULES (MANDATORY):
        1. **STRUCTURE**: Always provide a clear, line-by-line structure. Use double newlines between sections to avoid "bunched up" text.
        2. **HEADINGS**: Use **Bold Text** (e.g., **Introduction**) for all side headings. NEVER use '#' for headings.
        3. **TABLES**: If the user asks for a **Comparison**, **Schedule**, **Plan**, or **Data List**, you MUST respond with a **Markdown Table**. 
           - **PURCHASE LINKS**: Whenever recommending a pesticide or fertilizer in a table, ALWAYS include a column for 'Purchase Link' with a generic search URL (e.g., [Order Now](https://www.google.com/search?q=buy+Pesticide+Name)).
        4. **MAIN POINTS (GREEN)**: All main points or recommendations MUST be written as **Markdown Bullet Points** (using '-' or '*'). 
           - **LINE-BY-LINE PRECAUTIONS**: Safety precautions MUST be listed one per line with a blank line between them for maximum clarity.
           - Do NOT use emoji like '🟢' manually; the UI will handle it.
        5. **CONCISENESS**: Be detailed but well-organized. Use "Line by Line" matter for better readability.

        STRICT COMPLIANCE: If you are explaining a process or comparing two things, use a Table. For advice, use bold headings followed by green bullet points.
        """

    async def _extract_city(self, message: str) -> Optional[str]:
        """
        Uses a lightweight LLM call to extract the city name from a weather query.
        Returns None if no city is found or if it's not a weather query.
        """
        # Simple keyword check to avoid unnecessary API calls
        weather_keywords = ["weather", "climate", "temperature", "rain", "forecast", "humidity"]
        if not any(keyword in message.lower() for keyword in weather_keywords):
            return None

        try:
            extraction_prompt = f"""
            Extract the city name from this query: "{message}". 
            If a specific city is mentioned, return ONLY the city name. 
            If no city is mentioned (e.g. "what is the weather here"), return "CURRENT_LOCATION".
            If it's not a weather query, return "NONE".
            Output ONLY the word.
            """
            
            if self.use_gemini:
                response = await self.gemini_model.generate_content_async(extraction_prompt)
                result = response.text.strip()
            else:
                completion = self.client.chat.completions.create(
                    messages=[{"role": "user", "content": extraction_prompt}],
                    model="llama-3.3-70b-versatile",
                    temperature=0.1,
                    max_tokens=10,
                )
                result = completion.choices[0].message.content.strip()
            
            if result in ["NONE", "CURRENT_LOCATION"]: # Handling CURRENT_LOCATION later if we get frontend coords
                # For now, if "here" is asked without coords, we can't do much unless frontend sends it.
                # But if the user says "Hyderabad weather", we get "Hyderabad".
                if result == "CURRENT_LOCATION":
                     return None # Placeholder: Frontend hasn't implemented geo-location sending to chat yet
                return None
            return result
        except Exception:
            return None

    async def get_response(self, message: str, history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Generates a response from Groq based on the user message and history.
        """
        messages = [{"role": "system", "content": self.system_prompt}]
        
        # Check for weather intent and fetch data
        city = await self._extract_city(message)
        weather_context = ""
        
        if city:
            try:
                # remove punctuation from city if any (simple clean)
                city = city.strip(".,!?")
                print(f"DEBUG: Detected city for weather: {city}") 
                weather_data = await weather_service.get_weather_by_city(city)
                recommendations = weather_service.get_farming_recommendations(weather_data)
                
                full_weather_info = {
                    "city": city,
                    "current_conditions": weather_data,
                    "farming_advisory": recommendations
                }
                
                weather_context = f"\n\n[SYSTEM INJECTION: REAL-TIME WEATHER DATA]\n{json.dumps(full_weather_info, indent=2)}\n[END WEATHER DATA]\n"
                
                # Append this context to the system prompt or the latest user message
                messages[0]["content"] += weather_context
                
            except Exception as e:
                print(f"Weather fetch error: {e}")
                # We simply don't inject data if it fails, letting the LLM handle it naturally
                pass

        # Add history if provided
        if history:
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Add current user message
        messages.append({"role": "user", "content": message})
        
        try:
            if self.use_gemini:
                # Convert history for Gemini
                gemini_history = []
                for msg in (history or []):
                    role = "user" if msg["role"] == "user" else "model"
                    gemini_history.append({"role": role, "parts": [msg["content"]]})
                
                chat = self.gemini_model.start_chat(history=gemini_history)
                # Inject system prompt via specialized instructions if possible, 
                # or just as a first message. For 1.5-flash, we can use system_instruction in GenerativeModel init,
                # but let's keep it simple and prepend to the message.
                full_message = f"[SYSTEM INSTRUCTION]: {self.system_prompt}\n\nUser Message: {message}"
                response = await chat.send_message_async(full_message)
                return response.text
            else:
                chat_completion = self.client.chat.completions.create(
                    messages=messages,
                    model="llama-3.3-70b-versatile", # Using latest Llama 3.3
                    temperature=0.7,
                    max_tokens=1024,
                )
                return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Error calling LLM API (Gemini={self.use_gemini}): {e}")
            return "I apologize, but I am currently experiencing connection issues. Please try again later."

chatbot_service = ChatbotService()
