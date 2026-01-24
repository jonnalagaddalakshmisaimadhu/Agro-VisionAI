from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # active_connections[community_id] = list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

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

    async def broadcast(self, message: str, community_id: str):
        if community_id in self.active_connections:
            for connection in self.active_connections[community_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    # Connection might be dead
                    pass

manager = ConnectionManager()

@router.websocket("/ws/{community_id}")
async def websocket_endpoint(websocket: WebSocket, community_id: str):
    await manager.connect(websocket, community_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_json = json.loads(data)
                # Ensure time is added server-side for consistency
                message_json["time"] = datetime.datetime.now().strftime("%I:%M %p")
                message_json["id"] = int(datetime.datetime.now().timestamp() * 1000)
                await manager.broadcast(json.dumps(message_json), community_id)
            except json.JSONDecodeError:
                # Handle plain text if needed, but we expect JSON
                broadcast_msg = {
                    "text": data,
                    "sender": "System",
                    "time": datetime.datetime.now().strftime("%I:%M %p"),
                    "id": int(datetime.datetime.now().timestamp() * 1000)
                }
                await manager.broadcast(json.dumps(broadcast_msg), community_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, community_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, community_id)
