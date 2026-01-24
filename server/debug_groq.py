import sys
import os
from pathlib import Path

# Add server directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load .env for GROQ_API_KEY
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    with open(env_path, "r") as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                key, value = line.strip().split("=", 1)
                os.environ[key] = value
    print(f"Loaded .env from {env_path}")
else:
    print(f"Warning: .env not found at {env_path}")

print(f"GROQ_API_KEY present: {bool(os.getenv('GROQ_API_KEY'))}")

# Now import the service
try:
    from app.services.groq_service import groq_service
    print("Successfully imported groq_service")
    
    # Test it
    result = groq_service.get_disease_details("Corn___Cercospora_leaf_spot_Gray_leaf_spot", 0.98)
    
    print("\n=== GROQ RESPONSE ===")
    import json
    print(json.dumps(result, indent=2))
    
    # Check structure
    required_keys = ["disease_name", "confidence_score", "symptoms", "treatment", "prevention"]
    missing = [k for k in required_keys if k not in result]
    
    if not missing:
        print("\n✓ SUCCESS: All required keys present")
        print(f"✓ Symptoms count: {len(result.get('symptoms', []))}")
        print(f"✓ Treatment count: {len(result.get('treatment', []))}")
        print(f"✓ Prevention count: {len(result.get('prevention', []))}")
    else:
        print(f"\n✗ FAILURE: Missing keys: {missing}")
        
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
