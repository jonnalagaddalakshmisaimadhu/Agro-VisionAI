import os
import base64
import json
import traceback
from typing import Dict, List, Optional
import google.generativeai as genai
from app.core.config import settings

# Configure Gemini API
# Try to get key from settings, then env, then direct string as fallback
params_api_key = os.getenv("GEMINI_API_KEY")
if not params_api_key:
    # Fallback to the known key if not in env
    params_api_key = "YOUR_API_KEY"

genai.configure(api_key=params_api_key)

class DiseaseDetectionService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-flash-latest')
        print("Initialized Gemini-powered Disease Detection Service")
    
    def predict_disease(self, image_base64: str) -> Dict:
        """Predict disease from image using Gemini API."""
        try:
            print("Starting disease prediction via Gemini...")
            
            # Prepare the prompt
            prompt = """
            Analyze this image of a plant. Determine if it is healthy or has a disease.
            
            Provide the output strictly as a JSON object with the following fields:
            - disease_name: String (Format: "Plant Name: Disease Name" or "Plant Name: Healthy")
            - confidence_score: Float (between 0.0 and 1.0)
            - severity: String ("low", "medium", or "high". "low" if healthy)
            - symptoms: List of strings (Describe visual symptoms. Empty if healthy)
            - treatment: List of strings (Recommended treatments. Empty if healthy)
            - prevention: List of strings (Prevention methods. Generic care if healthy)
            - description: String (Brief summary of the condition)
            
            If the image is not a plant, return:
            {
                "disease_name": "Not a Plant",
                "confidence_score": 0.0,
                "severity": "none",
                "symptoms": ["Image does not appear to be a plant"],
                "treatment": ["Please upload a clear image of a plant leaf"],
                "prevention": [],
                "description": "The uploaded image could not be identified as a plant."
            }
            
            Do not use Markdown formatting (like ```json), just return the raw JSON string.
            """
            
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            
            # Generate content
            response = self.model.generate_content([
                {'mime_type': 'image/jpeg', 'data': image_data},
                prompt
            ])
            
            response_text = response.text.replace('```json', '').replace('```', '').strip()
            print(f"Gemini Response: {response_text}")
            
            # Parse JSON
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                # Fallback if JSON is malformed
                print("Error parsing Gemini JSON response, using fallback")
                return {
                    "disease_name": "Analysis Failed",
                    "confidence_score": 0.0,
                    "severity": "unknown",
                    "symptoms": ["Could not parse analysis result"],
                    "treatment": ["Please try again"],
                    "prevention": [],
                    "description": "An error occurred while analyzing the image."
                }
            
            # Normalize confidence score
            if 'confidence_score' not in result:
                result['confidence_score'] = 0.85
                
            # Ensure proper format for frontend
            final_result = {
                "disease_name": result.get("disease_name", "Unknown"),
                "confidence_score": float(result.get("confidence_score", 0.0)),
                "severity": result.get("severity", "low").lower(),
                "symptoms": result.get("symptoms", []),
                "treatment": result.get("treatment", []),
                "prevention": result.get("prevention", []),
                "description": result.get("description", "")
            }
            
            print(f"Final Result: {final_result}")
            return final_result
            
        except Exception as e:
            error_msg = f"ERROR during disease prediction: {e}\n{traceback.format_exc()}"
            print(error_msg)
            try:
                with open("debug_errors.log", "a") as f:
                    f.write(error_msg + "\n" + "-"*50 + "\n")
            except:
                pass
            raise ValueError(f"Error during disease prediction: {str(e)}")

# Create global instance
disease_detection_service = DiseaseDetectionService()
