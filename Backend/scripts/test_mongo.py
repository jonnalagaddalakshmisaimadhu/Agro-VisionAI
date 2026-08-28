import asyncio
import os
import sys

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add Backend to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))

from motor.motor_asyncio import AsyncIOMotorClient

mongo_uri = os.getenv("MONGO_URI", "mongodb+srv://saimadhu:saimadhu@cluster0.mwcg76p.mongodb.net/farmiq?retryWrites=true&w=majority&appName=Cluster0")
mongo_db_name = os.getenv("MONGO_DB_NAME", "farmiq")

async def test_mongodb():
    print("=" * 80)
    print(" TESTING MONGODB ATLAS CONNECTION")
    print("=" * 80)
    print(f"Connecting to URI: {mongo_uri[:45]}...")
    
    try:
        client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=8000)
        print("Pinging MongoDB Atlas cluster...")
        res = await client.admin.command('ping')
        print(f" Ping response: {res}")
        print(" [OK] Successfully connected to MongoDB Atlas Cloud Cluster!")
        
        # Test creating sample documents in farmiq database
        db = client[mongo_db_name]
        sample_doc = {
            "sensor": "Water_pH_Sensor",
            "value": 7.8,
            "unit": "pH",
            "pond_id": "Pond_AP_01",
            "dissolved_oxygen": 6.5,
            "temperature_celsius": 28.4,
            "status": "optimal",
            "created_at": "2026-08-28T22:00:00Z"
        }
        await db.telemetry_logs.insert_one(sample_doc)
        
        # Also seed sample chat_sessions
        if await db.chat_sessions.count_documents({}) == 0:
            sample_chats = [
                {
                    "session_id": "session_farmer_01",
                    "user_name": "Lakshmi Sai Madhu",
                    "query": "What is the best pesticide for tomato early blight in Guntur district?",
                    "response": "For Tomato Early Blight, recommended foliar spray is Mancozeb 75% WP @ 2.5g/L or Chlorothalonil with drip irrigation.",
                    "intent": "DISEASE_DIAGNOSIS",
                    "timestamp": "2026-08-28T22:15:00Z"
                },
                {
                    "session_id": "session_farmer_02",
                    "user_name": "Ram Charan",
                    "query": "What is the current mandi market price of Guntur Teja dried red chilli?",
                    "response": "Current wholesale price of Guntur Teja Red Chilli at Guntur Mirchi Yard is Rs 220/kg (Trend: Bullish +4.7%).",
                    "intent": "MARKET_INQUIRY",
                    "timestamp": "2026-08-28T22:20:00Z"
                }
            ]
            await db.chat_sessions.insert_many(sample_chats)
            print(" [OK] Seeded 'chat_sessions' collection in MongoDB Atlas!")
        
        # Count documents
        count_telemetry = await db.telemetry_logs.count_documents({})
        count_chats = await db.chat_sessions.count_documents({})
        print(f" [OK] 'telemetry_logs' count: {count_telemetry}")
        print(f" [OK] 'chat_sessions' count: {count_chats}")
        
        client.close()
        print("\n MongoDB Atlas is 100% active and connected to FarmIQ!")
    except Exception as e:
        print(f"\n [!] MongoDB Connection Error: {e}")
        print("\nTip: Make sure you clicked 'Add User' in Atlas, and under 'Network Access' you added '0.0.0.0/0' (Allow from anywhere).")

if __name__ == "__main__":
    asyncio.run(test_mongodb())
