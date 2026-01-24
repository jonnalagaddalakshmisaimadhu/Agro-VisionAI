import os
import requests
import json
import traceback
from typing import Dict, List, Optional
from app.core.config import settings

class GroqService:
    def __init__(self):
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.3-70b-versatile"  # Updated to supported model

    def get_disease_details(self, disease_name: str, confidence: float) -> Dict:
        """
        Fetch detailed symptoms, treatment, and prevention info for a detected disease using Groq.
        """
        # Prioritize central settings, fallback to os.getenv
        api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        
        if not api_key:
            print("CRITICAL ERROR: GROQ_API_KEY not found in settings or environment.")
            return self._get_fallback_details(disease_name, confidence)

        print(f"Fetching exactly 5 points for '{disease_name}' from Groq...")

        prompt = f"""
        You are an expert agricultural botanist specializing in plant pathology.
        A plant disease has been detected:
        Disease Name: {disease_name}
        Confidence Score: {confidence}

        Please provide a professional analysis in JSON format with the following keys:
        - "disease_name": (Confirm the name)
        - "confidence_score": (Use the provided score)
        - "severity": (Estimate severity: "low", "medium", or "high")
        - "symptoms": (A list of EXACTLY 5 clear, visible symptoms)
        - "treatment": (A list of EXACTLY 5 effective treatment or management methods)
        - "prevention": (A list of EXACTLY 5 prevention strategies for future crops)
        - "description": (A tailored 1-2 sentence summary of the diagnosis and recommended urgency)

        Return ONLY a valid JSON object. No markdown, no pre-text, no post-text.
        """

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a professional agricultural assistant. You always provide EXACTLY 5 bullet points for symptoms, treatment, and prevention in a JSON response."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1500,
            "stream": False,
            "response_format": {"type": "json_object"}
        }

        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=20)
            if not response.ok:
                error_msg = f"Groq API Error: {response.status_code} - {response.text}"
                print(error_msg)
                with open("groq_error.log", "a") as f:
                    f.write(f"\n[{disease_name}] ERROR: {error_msg}")
            
            response.raise_for_status()
            
            data = response.json()
            content = data['choices'][0]['message']['content']
            parsed_content = json.loads(content)
            
            # Extract and ensure exactly 5 points where possible
            def normalize_list(lst, default_msg):
                if not isinstance(lst, list): return [default_msg] * 5
                if len(lst) >= 5: return lst[:5]
                return lst + [default_msg] * (5 - len(lst))

            return {
                "disease_name": parsed_content.get("disease_name", disease_name),
                "confidence_score": parsed_content.get("confidence_score", confidence),
                "severity": parsed_content.get("severity", "medium"),
                "symptoms": normalize_list(parsed_content.get("symptoms"), "Wait for analysis results"),
                "treatment": normalize_list(parsed_content.get("treatment"), "Consult standard agricultural guide"),
                "prevention": normalize_list(parsed_content.get("prevention"), "Maintain regular crop monitoring"),
                "description": parsed_content.get("description", f"Detected {disease_name}")
            }

        except Exception as e:
            print(f"Groq Integration Exception: {str(e)}")
            traceback.print_exc()
            return self._get_fallback_details(disease_name, confidence)

    def _get_fallback_details(self, disease_name: str, confidence: float) -> Dict:
        """Return basic details if API fails."""
        return {
            "disease_name": disease_name,
            "confidence_score": confidence,
            "severity": "medium",
            "symptoms": ["Analysis unavailable (API Connection Issue)", "Monitor for leaf yellowing", "Check for wilting", "Inspect stems", "Verify soil moisture"],
            "treatment": ["Consult a local expert", "Remove infected plant parts", "Ensure proper spacing", "Avoid overhead watering", "Apply appropriate fungicide"],
            "prevention": ["Maintain crop hygiene", "Use resistant varieties", "Rotate crops yearly", "Sterilize tools after use", "Ensure good drainage"],
            "description": f"Detected {disease_name} with {confidence:.2f} confidence. Please check API connection."
        }

groq_service = GroqService()
