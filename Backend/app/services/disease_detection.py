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
# File is at Backend/app/services/disease_detection.py
# models_dir should be Backend/models
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
        # Path fixed for the new 210MB model location
        self.model_path = models_dir / "Final ML Model" / "plant_disease_model_1_latest.pt"
        self.model = None
        
        # ALWAYS handle Gemini setup
        from app.core.config import settings
        gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        if gemini_key:
            genai.configure(api_key=gemini_key)

        
        # Detect best available model
        self.model_name = 'models/gemini-flash-latest' 
        try:
            available = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
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
                
                abs_model_path = self.model_path.resolve()
                print(f"Attempting to load local model from: {abs_model_path}")
                
                if abs_model_path.exists() and abs_model_path.stat().st_size > 1024:
                    checkpoint = torch.load(abs_model_path, map_location=self.device, weights_only=False)
                    self.model = CNN(39)
                    
                    state_dict = checkpoint.get('state_dict', checkpoint) if isinstance(checkpoint, dict) else checkpoint
                    try:
                        self.model.load_state_dict(state_dict)
                    except:
                        if not isinstance(checkpoint, dict):
                            self.model = checkpoint
                    
                    self.model.to(self.device).eval()
                    self.use_gemini_fallback = False 
                    print(f"Local detection model loaded successfully on {self.device}")
                else:
                    print(f"INFO: Local model not found or placeholder. Fallback mode enabled.")
            except Exception as e:
                print(f"Model load skipped: {e}. Using Gemini AI.")
        
    def predict_disease(self, image_base64: str) -> Dict:
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
                disease_name = disease_class_raw.replace("___", ": ").replace("_", " ")
                
                return self._get_details_via_gemini(image_base64, disease_name, confidence_score)
            except Exception as e:
                print(f"Local prediction failed: {e}. Falling back.")
        
        return self._predict_via_gemini(image_base64)

    def _get_details_via_gemini(self, image_base64: str, detected_name: str, confidence: float) -> Dict:
        try:
            from app.services.groq_service import groq_service
            return groq_service.get_disease_details(detected_name, confidence)
        except Exception as e:
            return {
                "disease_name": detected_name,
                "confidence_score": confidence,
                "severity": "medium",
                "symptoms": ["Analysis complete"],
                "treatment": ["Follow standard practices"],
                "prevention": ["Regular monitoring"],
                "description": f"Detected {detected_name}."
            }

    def _predict_via_gemini(self, image_base64: str) -> Dict:
        try:
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            image_data = base64.b64decode(image_base64)
            image_pil = Image.open(io.BytesIO(image_data)).convert('RGB')
            
            prompt = f"""
            Analyze this leaf image for signs of disease. 
            Possible categories: {list(IDX_TO_CLASSES.values())}
            
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
            return {
                "disease_name": "Unknown",
                "confidence_score": 0.0,
                "severity": "medium",
                "symptoms": ["Error occurred"],
                "treatment": ["Re-upload photo"],
                "prevention": [],
                "description": str(e)
            }

    def _parse_gemini_response(self, text: str) -> Dict:
        text = text.strip()
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].strip()
        if '{' in text and '}' in text:
            text = text[text.find('{'):text.rfind('}')+1]
        return json.loads(text)

disease_detection_service = DiseaseDetectionService()
