
import os
import json
from groq import Groq
from typing import List, Dict, Optional
from app.services.weather import weather_service

class ChatbotService:
    def __init__(self):
        # Initialize Groq client
        self.api_key = os.getenv("GROQ_API_KEY", "YOUR_API_KEY_HERE")
        self.client = Groq(api_key=self.api_key)
        
        self.system_prompt = """
        You are 'Farm IQ Assistance', an intelligent agricultural assistant for the Farm IQ platform.
        
        Your Mission:
        - Provide accurate, helpful, and scientific information related to agriculture, farming, crops, soil health, plant diseases, and agri-tech.
        - Explain the features and usage of the Farm IQ project (this application).
        - Assist farmers in making informed decisions.
        - **WEATHER REPORTING:** You have access to real-time weather data. When a user asks about the weather/climate, use the provided JSON data to give a detailed report including temperature, humidity, and specific farming recommendations (planting, irrigation, etc.).
        
        Guidelines:
        - STRICTLY answer only questions related to Agriculture, Farming, Gardening, Agri-Tech, and this Farm IQ platform.
        - **LANGUAGE SUPPORT:** Always detect the language of the user's query and respond in the **SAME LANGUAGE**.
        - Be concise, professional, and encouraging.
        - **FORMATTING RULES (STRICT):**
            - **RESPONSE STRUCTURE:**
                1. **Introduction**: Brief greeting or answer summary.
                2. **Detailed Point 1** (e.g., Symptoms/Steps)
                3. **Detailed Point 2** (e.g., Treatment/Advice)
                4. **Conclusion**
            - **STYLING:**
                - All **Side Headings** must be **Bold**.
                - IMPORTANT: ALL Bullet points must start with the '🟢' emoji to indicate a Green Point.
                - Use **Bold** for key terms within sentences.
            - **Example:**
                **Introduction**
                Here is the information you requested about Wheat...
                
                **Key Benefits**
                🟢 High yield potential in loamy soil.
                🟢 Resistant to common pests.
                
                **Recommended Action**
                🟢 Apply Nitrogen fertilizer at week 4.
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
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile", # Using latest Llama 3.3
                temperature=0.7,
                max_tokens=1024,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Error calling Groq API: {e}")
            return "I apologize, but I am currently experiencing connection issues. Please try again later."

chatbot_service = ChatbotService()
