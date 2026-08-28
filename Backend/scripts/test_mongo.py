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
        
        # Test creating a sample document in farmiq database
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
        result = await db.telemetry_logs.insert_one(sample_doc)
        print(f" [OK] Inserted telemetry sample doc into '{mongo_db_name}.telemetry_logs' (ID: {result.inserted_id})")
        
        # Count documents
        count = await db.telemetry_logs.count_documents({})
        print(f" [OK] Total documents in 'telemetry_logs': {count}")
        
        client.close()
        print("\n MongoDB Atlas is 100% active and connected to FarmIQ!")
    except Exception as e:
        print(f"\n [!] MongoDB Connection Error: {e}")
        print("\nTip: Make sure you clicked 'Add User' in Atlas, and under 'Network Access' you added '0.0.0.0/0' (Allow from anywhere).")

if __name__ == "__main__":
    asyncio.run(test_mongodb())
