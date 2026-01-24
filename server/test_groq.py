import sys
import os
from pathlib import Path

# Add server directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load .env manually for test script
env_path = Path(__file__).resolve().parents[0] / ".env"  # Try server/.env
if not env_path.exists():
    env_path = Path(__file__).resolve().parents[1] / ".env" # Try root .env

if env_path.exists():
    with open(env_path, "r") as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                key, value = line.strip().split("=", 1)
                os.environ[key] = value

from app.services.groq_service import groq_service

def test_groq():
    print("Testing Groq Service...")
    
    # Simulate a detected disease
    disease = "Tomato___Early_blight"
    confidence = 0.98
    
    result = groq_service.get_disease_details(disease, confidence)
    
    print("\n--- Result ---")
    print(result)
    
    # Basic validation
    required_keys = ["disease_name", "confidence_score", "symptoms", "treatment", "prevention"]
    missing = [k for k in required_keys if k not in result]
    
    if not missing:
        print("\nSUCCESS: All required keys present.")
    else:
        print(f"\nFAILURE: Missing keys: {missing}")

if __name__ == "__main__":
    test_groq()
