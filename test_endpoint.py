import requests
import base64
import os

url = 'http://localhost:8000/api/disease/predict-test'
image_path = 'public/favicon.ico'  # Use a small existing image for testing

if not os.path.exists(image_path):
    print(f"Image not found at {image_path}")
    exit(1)

with open(image_path, 'rb') as f:
    img_base64 = base64.b64encode(f.read()).decode()

try:
    response = requests.post(url, json={'image_base64': img_base64})
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
