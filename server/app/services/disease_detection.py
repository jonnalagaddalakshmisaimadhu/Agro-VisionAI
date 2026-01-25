import os
import base64
import json
import traceback
import io
from PIL import Image
from typing import Dict, List, Optional
from pathlib import Path
import sys

# Optional imports for local ML
try:
    import torch
    import torch.nn as nn
    from torchvision import transforms
    import pandas as pd
    HAS_LOCAL_ML = True
except Exception as e:
    HAS_LOCAL_ML = False
    print(f"PyTorch or related libraries missing: {e}. Local ML mode disabled.")

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# Add models path to sys.path to import CNN
models_dir = Path(__file__).resolve().parents[2] / "models"
if str(models_dir) not in sys.path:
    sys.path.append(str(models_dir))

# Try to import CNN logic
try:
    from CNN import CNN, idx_to_classes
    HAS_CNN_LOGIC = True
except ImportError:
    HAS_CNN_LOGIC = False
    print("CNN logic (CNN.py) missing or could not be imported.")

# idx_to_classes mapping for all 39 supported categories
IDX_TO_CLASSES = {0: 'Apple___Apple_scab',
                  1: 'Apple___Black_rot',
                  2: 'Apple___Cedar_apple_rust',
                  3: 'Apple___healthy',
                  4: 'Background_without_leaves',
                  5: 'Blueberry___healthy',
                  6: 'Cherry___Powdery_mildew',
                  7: 'Cherry___healthy',
                  8: 'Corn___Cercospora_leaf_spot Gray_leaf_spot',
                  9: 'Corn___Common_rust',
                  10: 'Corn___Northern_Leaf_Blight',
                  11: 'Corn___healthy',
                  12: 'Grape___Black_rot',
                  13: 'Grape___Esca_(Black_Measles)',
                  14: 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
                  15: 'Grape___healthy',
                  16: 'Orange___Haunglongbing_(Citrus_greening)',
                  17: 'Peach___Bacterial_spot',
                  18: 'Peach___healthy',
                  19: 'Pepper,_bell___Bacterial_spot',
                  20: 'Pepper,_bell___healthy',
                  21: 'Potato___Early_blight',
                  22: 'Potato___Late_blight',
                  23: 'Potato___healthy',
                  24: 'Raspberry___healthy',
                  25: 'Soybean___healthy',
                  26: 'Squash___Powdery_mildew',
                  27: 'Strawberry___Leaf_scorch',
                  28: 'Strawberry___healthy',
                  29: 'Tomato___Bacterial_spot',
                  30: 'Tomato___Early_blight',
                  31: 'Tomato___Late_blight',
                  32: 'Tomato___Leaf_Mold',
                  33: 'Tomato___Septoria_leaf_spot',
                  34: 'Tomato___Spider_mites Two-spotted_spider_mite',
                  35: 'Tomato___Target_Spot',
                  36: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
                  37: 'Tomato___Tomato_mosaic_virus',
                  38: 'Tomato___healthy'}

class DiseaseDetectionService:
    def __init__(self):
        self.device = None
        self.model_path = models_dir / "plant_disease_model.pt"
        self.model = None
        
        # ALWAYS handle Gemini setup
        gemini_key = os.getenv("GEMINI_API_KEY", "AIzaSyDo7yx7Aw0yLmlwItdyFgxiCZp7xSzaU_I")
        genai.configure(api_key=gemini_key)
        
        # Detect best available model fromConfirmed list
        self.model_name = 'models/gemini-flash-latest' 
        try:
            available = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            print(f"DEBUG: Available models: {available}")
            if 'models/gemini-flash-latest' in available:
                self.model_name = 'models/gemini-flash-latest'
            elif 'models/gemini-pro-vision' in available:
                self.model_name = 'models/gemini-pro-vision'
        except Exception as e:
            print(f"DEBUG: Error listing models: {e}")

        self.gemini_model = genai.GenerativeModel(self.model_name)
        
        # Attempt to load local model
        self.use_gemini_fallback = True 
        if HAS_LOCAL_ML and HAS_CNN_LOGIC:
            try:
                self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
                self.transform = transforms.Compose([
                    transforms.Resize((224, 224)),
                    transforms.ToTensor(),
                ])
                
                # Ensure absolute path for robustness
                abs_model_path = self.model_path.resolve()
                print(f"Attempting to load local model from: {abs_model_path}")
                
                if abs_model_path.exists():
                    # Load model
                    checkpoint = torch.load(abs_model_path, map_location=self.device)
                    self.model = CNN(39)
                    
                    # Handle state_dict vs full model
                    state_dict = checkpoint.get('state_dict', checkpoint) if isinstance(checkpoint, dict) else checkpoint
                    try:
                        self.model.load_state_dict(state_dict)
                    except:
                        # Try loading directly if load_state_dict fails
                        if not isinstance(checkpoint, dict):
                            self.model = checkpoint
                    
                    self.model.to(self.device).eval()
                    self.use_gemini_fallback = False # Successfully loaded!
                    print(f"Local detection model (CNN 39) loaded successfully on {self.device}")
                else:
                    print(f"CRITICAL: Model file not found at {abs_model_path}")
            except Exception as e:
                print(f"PyTorch load failed: {e}. Fallback enabled.")
                traceback.print_exc()
        
        print(f"Service state: Fallback={self.use_gemini_fallback}, Gemini={self.model_name}")

    def predict_disease(self, image_base64: str) -> Dict:
        """Analyze image for disease via local model with Gemini fallback."""
        if not self.use_gemini_fallback and self.model is not None:
            try:
                if ',' in image_base64:
                    image_base64 = image_base64.split(',')[1]
                image_data = base64.b64decode(image_base64)
                image_pil = Image.open(io.BytesIO(image_data)).convert('RGB')
                
                input_tensor = self.transform(image_pil).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    outputs = self.model(input_tensor)
                    probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                    confidence, predicted_idx = torch.max(probabilities, 0)
                
                class_idx = int(predicted_idx.item())
                confidence_score = float(confidence.item())
                disease_class_raw = IDX_TO_CLASSES.get(class_idx, "Unknown")
                
                # Cleanup class name
                disease_name = disease_class_raw.replace("___", ": ").replace("_", " ")
                
                print(f"Local detection: {disease_name} ({confidence_score:.2f})")
                
                # Use Gemini to get rich details for the detected class
                return self._get_details_via_gemini(image_base64, disease_name, confidence_score)
            except Exception as e:
                print(f"Local prediction failed: {e}. Falling back to full Gemini analysis.")
        
        return self._predict_via_gemini(image_base64)

    def _get_details_via_gemini(self, image_base64: str, detected_name: str, confidence: float) -> Dict:
        """
        Fetch rich details for the locally detected disease.
        We now use Groq (Llama 3) for the text details as it's faster and high quality.
        """
        try:
            from app.services.groq_service import groq_service
            return groq_service.get_disease_details(detected_name, confidence)
        except Exception as e:
            print(f"Error calling Groq service: {e}")
            traceback.print_exc()
            return {
                "disease_name": detected_name,
                "confidence_score": confidence,
                "severity": "medium",
                "symptoms": ["Analysis complete"],
                "treatment": ["Follow standard practices"],
                "prevention": ["Monitor regularly"],
                "description": f"Detected {detected_name} with {confidence:.2f} confidence."
            }

    def _predict_via_gemini(self, image_base64: str) -> Dict:
        """Full fallback prediction using Gemini API with class context."""
        print(f"Starting full Gemini API analysis...")
        try:
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            image_data = base64.b64decode(image_base64)
            image_pil = Image.open(io.BytesIO(image_data)).convert('RGB')
            
            prompt = f"""
            Analyze this leaf image for signs of disease. 
            Possible categories include: {list(IDX_TO_CLASSES.values())}
            
            Return ONLY a JSON object:
            {{
                "disease_name": "Crop: Condition",
                "confidence_score": 0.95,
                "severity": "low/medium/high",
                "symptoms": ["list"],
                "treatment": ["list"],
                "prevention": ["list"],
                "description": "diagnosis summary"
            }}
            """
            response = self.gemini_model.generate_content([prompt, image_pil])
            return self._parse_gemini_response(response.text)
        except Exception as e:
            traceback.print_exc()
            return {
                "disease_name": "Unknown Condition",
                "confidence_score": 0.0,
                "severity": "none",
                "symptoms": ["Analysis unavailable"],
                "treatment": ["Retry with a clearer photo"],
                "prevention": [],
                "description": f"Error: {str(e)}"
            }

    def _parse_gemini_response(self, text: str) -> Dict:
        """Parse JSON response from Gemini."""
        text = text.strip()
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].strip()
        
        if '{' in text and '}' in text:
            text = text[text.find('{'):text.rfind('}')+1]
            
        return json.loads(text)

disease_detection_service = DiseaseDetectionService()
