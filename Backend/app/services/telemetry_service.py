import asyncio
import json
import logging
import os
import time
from typing import Dict, Any, List, Optional, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class TelemetryEngine:
    """
    Enterprise Real-Time Telemetry Engine utilizing Redis 7.2 Pub/Sub
    and Geospatial Sets (GEOADD / GEORADIUS) with graceful in-memory fallback.
    """

    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis_client = None
        self.redis_available = False
        
        # In-Memory Geospatial & Telemetry State Cache (Fault-tolerant fallback)
        self._memory_telemetry: Dict[str, Dict[str, Any]] = {}
        self._memory_subscribers: Set[WebSocket] = set()
        self._trip_subscribers: Dict[int, Set[WebSocket]] = {}
        
        # Connect asynchronously or test Redis connection
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            client = redis.Redis.from_url(self.redis_url, decode_responses=True, socket_timeout=1.5)
            client.ping()
            self.redis_client = client
            self.redis_available = True
            logger.info("Connected successfully to Redis 7.2 Telemetry Engine!")
        except Exception as e:
            self.redis_available = False
            logger.info(f"Redis not detected locally ({e}). Operating high-performance In-Memory Telemetry Engine.")

    async def ingest_telemetry(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingests real-time GPS coordinate telemetry from vehicles, stores in GeoSet,
        and broadcasts to Pub/Sub stream subscribers.
        """
        vehicle_id = str(telemetry.get("vehicle_id", "TRK-01"))
        trip_id = telemetry.get("trip_id")
        lat = float(telemetry.get("latitude", 0.0))
        lon = float(telemetry.get("longitude", 0.0))
        speed = float(telemetry.get("speed_kmh", 0.0))
        heading = float(telemetry.get("heading", 0.0))
        timestamp = telemetry.get("timestamp") or time.time()

        record = {
            "vehicle_id": vehicle_id,
            "trip_id": trip_id,
            "latitude": lat,
            "longitude": lon,
            "speed_kmh": round(speed, 1),
            "heading": round(heading, 1),
            "timestamp": timestamp,
            "status": telemetry.get("status", "ACTIVE"),
            "battery_pct": telemetry.get("battery_pct", 98)
        }

        # 1. Update in Redis if available
        if self.redis_available and self.redis_client:
            try:
                # Store coordinates in Redis GeoSet (lon, lat, member)
                self.redis_client.geoadd("vehicles:locations", (lon, lat, vehicle_id))
                # Store detailed state hash with 1-hour TTL
                self.redis_client.set(f"vehicle:{vehicle_id}:state", json.dumps(record), ex=3600)
                # Publish event to channel
                self.redis_client.publish("telemetry:stream", json.dumps(record))
            except Exception as e:
                logger.warning(f"Redis operation error: {e}. Falling back to memory state.")
                self.redis_available = False

        # 2. Update In-Memory cache
        self._memory_telemetry[vehicle_id] = record

        # 3. Broadcast to all active WebSocket clients
        await self.broadcast_telemetry(record)

        return record

    async def broadcast_telemetry(self, record: Dict[str, Any]):
        """Broadcasts live telemetry record to connected WebSocket clients."""
        payload_str = json.dumps({
            "type": "TELEMETRY_UPDATE",
            "data": record
        })

        dead_sockets = set()
        for ws in list(self._memory_subscribers):
            try:
                await ws.send_text(payload_str)
            except Exception:
                dead_sockets.add(ws)

        for dead in dead_sockets:
            self._memory_subscribers.discard(dead)

        # Check trip-specific subscribers
        trip_id = record.get("trip_id")
        if trip_id and trip_id in self._trip_subscribers:
            trip_dead = set()
            for ws in list(self._trip_subscribers[trip_id]):
                try:
                    await ws.send_text(payload_str)
                except Exception:
                    trip_dead.add(ws)
            for dead in trip_dead:
                self._trip_subscribers[trip_id].discard(dead)

    def register_client(self, websocket: WebSocket, trip_id: Optional[int] = None):
        """Registers a client WebSocket for telemetry streaming."""
        self._memory_subscribers.add(websocket)
        if trip_id:
            if trip_id not in self._trip_subscribers:
                self._trip_subscribers[trip_id] = set()
            self._trip_subscribers[trip_id].add(websocket)

    def unregister_client(self, websocket: WebSocket, trip_id: Optional[int] = None):
        """Unregisters a client WebSocket."""
        self._memory_subscribers.discard(websocket)
        if trip_id and trip_id in self._trip_subscribers:
            self._trip_subscribers[trip_id].discard(websocket)

    def get_all_active_vehicles(self) -> List[Dict[str, Any]]:
        """Returns all vehicles currently reporting telemetry."""
        return list(self._memory_telemetry.values())

    def get_vehicle_location(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        """Returns instantaneous location of a given vehicle."""
        return self._memory_telemetry.get(vehicle_id)

telemetry_service = TelemetryEngine()
