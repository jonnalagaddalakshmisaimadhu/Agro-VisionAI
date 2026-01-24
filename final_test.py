import requests
import base64
import os
import json

url = 'http://localhost:8000/api/disease/predict-test'
image_path = r'C:/Users/Sai Madhu/.gemini/antigravity/brain/1c9ae56d-66e8-4301-a894-f7b484f35cd8/uploaded_image_1769188522213.png'

if not os.path.exists(image_path):
    print(f"Image not found at {image_path}")
    exit(1)

with open(image_path, 'rb') as f:
    img_base64 = base64.b64encode(f.read()).decode()

print(f"Sending request to backend for {image_path}...")
try:
    response = requests.post(url, json={'image_base64': img_base64}, timeout=30)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error during request: {e}")
