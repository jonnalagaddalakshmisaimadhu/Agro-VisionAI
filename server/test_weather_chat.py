import requests
import json

def test_chat():
    url = "http://localhost:8000/api/chat"
    payload = {
        "message": "What is the climate situation in Hyderabad?",
        "history": []
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"Sending request to {url}...")
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            print("Response Received")
            data = response.json()
            with open("result.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print("Saved to result.json")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_chat()
