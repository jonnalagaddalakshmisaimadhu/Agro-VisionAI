from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import List, Dict
import json
import datetime

router = APIRouter()

SEED_COMMUNITIES = [
    {
        "id": "1",
        "name": "🌾 Delta Paddy & Rice Growers Hub",
        "members": 1420,
        "region": "Andhra Pradesh & Telangana",
        "category": "Paddy & Grains",
        "description": "Live discussions on BPT-5204/MTU-1010 varieties, water management, blast disease prevention, and mandi rates.",
        "active_now": 48
    },
    {
        "id": "2",
        "name": "🌶️ Guntur Chilli & Cotton Farmers Circle",
        "members": 1980,
        "region": "Guntur / Prakasam / Warangal",
        "category": "Cash Crops",
        "description": "Combat black thrips, pesticide rotation, drip fertigation schedules, and live Guntur Mirchi yard prices.",
        "active_now": 73
    },
    {
        "id": "3",
        "name": "🚜 Farm Machinery & Drone Tech Forum",
        "members": 860,
        "region": "South India",
        "category": "Mechanization",
        "description": "Custom hiring rates, drone spraying calibrations, tractor implements, rotavators, and laser leveling experiences.",
        "active_now": 29
    },
    {
        "id": "4",
        "name": "💧 Micro-Irrigation & Solar Pumps Club",
        "members": 650,
        "region": "Rayalaseema / Mahabubnagar",
        "category": "Water & Tech",
        "description": "APMIP / PM-KUSUM subsidy applications, drip clogging solutions, soil moisture automation, and solar pumps.",
        "active_now": 22
    },
    {
        "id": "5",
        "name": "🌿 Natural & Organic Zero-Budget Farming",
        "members": 1120,
        "region": "All Regions",
        "category": "Organic",
        "description": "Jeevamrutham preparation, neem oil pest repellents, vermicompost techniques, and organic certification.",
        "active_now": 35
    }
]

INITIAL_HISTORY: Dict[str, List[dict]] = {
    "1": [
        {
            "id": 101,
            "sender": "Subba Rao (Paddy Farmer · Tenali)",
            "text": "Namaste everyone! How is the MTU-1061 nursery germination in Guntur district this week?",
            "time": "10:15 AM",
            "is_expert": False,
            "reaction": "🌾"
        },
        {
            "id": 102,
            "sender": "Dr. Raj Kumar (Agronomist)",
            "text": "Due to intermittent morning fog, keep a close watch on blast spots on leaf tips. Spray Tricyclazole 75% WP @ 0.6g/L if symptoms appear.",
            "time": "10:22 AM",
            "is_expert": True,
            "reaction": "✓ Verified by Agronomist"
        },
        {
            "id": 103,
            "sender": "Kalyan Reddy (Farmer · Bapatla)",
            "text": "Applied bio-fertilizer with Zinc sulphate yesterday. Result looks very promising!",
            "time": "10:45 AM",
            "is_expert": False,
            "reaction": "👍"
        }
    ],
    "2": [
        {
            "id": 201,
            "sender": "Venkatesh (Chilli Grower · Guntur)",
            "text": "What is today's Teja variety rate in Guntur Mirchi Yard?",
            "time": "09:30 AM",
            "is_expert": False,
            "reaction": "🌶️"
        },
        {
            "id": 202,
            "sender": "Srinivasa Rao (Trader/Farmer)",
            "text": "Deluxe grade Teja is hovering around ₹19,500 - ₹21,200 per quintal depending on moisture and color.",
            "time": "09:42 AM",
            "is_expert": False,
            "reaction": "💰"
        },
        {
            "id": 203,
            "sender": "Dr. Priya Sharma (Entomologist)",
            "text": "For thrips management, install 20 blue sticky traps per acre and use NeemAzal 10,000 ppm before spraying synthetic chemicals.",
            "time": "10:05 AM",
            "is_expert": True,
            "reaction": "✓ Verified by Agronomist"
        }
    ],
    "3": [
        {
            "id": 301,
            "sender": "Ram Charan (Tractor Owner)",
            "text": "Laser land levelers save 25-30% irrigation water in paddy fields. Available for custom hiring across Guntur & Tenali.",
            "time": "08:30 AM",
            "is_expert": False,
            "reaction": "🚜"
        },
        {
            "id": 302,
            "sender": "Charith (Drone Pilot · Vijayawada)",
            "text": "Drone spraying covers 1 acre in just 7-8 minutes with uniform micron droplet coverage. Battery charging setup ready on field.",
            "time": "08:50 AM",
            "is_expert": False,
            "reaction": "⚡"
        }
    ]
}

class CommunityHubManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.history: Dict[str, List[dict]] = INITIAL_HISTORY

    async def connect(self, websocket: WebSocket, community_id: str):
        await websocket.accept()
        if community_id not in self.active_connections:
            self.active_connections[community_id] = []
        self.active_connections[community_id].append(websocket)

    def disconnect(self, websocket: WebSocket, community_id: str):
        if community_id in self.active_connections:
            if websocket in self.active_connections[community_id]:
                self.active_connections[community_id].remove(websocket)
            if not self.active_connections[community_id]:
                del self.active_connections[community_id]

    async def broadcast(self, message_data: dict, community_id: str):
        if community_id not in self.history:
            self.history[community_id] = []
        self.history[community_id].append(message_data)
        if len(self.history[community_id]) > 100:
            self.history[community_id] = self.history[community_id][-100:]

        if community_id in self.active_connections:
            for connection in self.active_connections[community_id]:
                try:
                    await connection.send_json(message_data)
                except Exception:
                    pass

community_hub_manager = CommunityHubManager()

@router.get("/channels")
def get_community_channels():
    """Return all active community farmer channels."""
    return {"channels": SEED_COMMUNITIES}

@router.get("/channels/{community_id}/history")
def get_channel_history(community_id: str):
    """Fetch chat history for a community channel."""
    history = community_hub_manager.history.get(community_id, [])
    return {"community_id": community_id, "messages": history}

@router.websocket("/ws/{community_id}")
async def websocket_endpoint(websocket: WebSocket, community_id: str):
    await community_hub_manager.connect(websocket, community_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                msg["time"] = msg.get("time") or datetime.datetime.now().strftime("%I:%M %p")
                msg["id"] = msg.get("id") or int(datetime.datetime.now().timestamp() * 1000)
                await community_hub_manager.broadcast(msg, community_id)
            except json.JSONDecodeError:
                broadcast_msg = {
                    "id": int(datetime.datetime.now().timestamp() * 1000),
                    "sender": "Farmer",
                    "text": data,
                    "time": datetime.datetime.now().strftime("%I:%M %p"),
                    "is_expert": False
                }
                await community_hub_manager.broadcast(broadcast_msg, community_id)
    except WebSocketDisconnect:
        community_hub_manager.disconnect(websocket, community_id)
    except Exception as e:
        print(f"Community WebSocket error: {e}")
        community_hub_manager.disconnect(websocket, community_id)
