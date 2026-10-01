import asyncio
import math
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.spatial_incident import Trip
from app.services.telemetry_service import telemetry_service
from app.services.routing_service import routing_service

logger = logging.getLogger(__name__)

router = APIRouter()

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------
class TelemetryIngestModel(BaseModel):
    vehicle_id: str = Field(..., description="Vehicle license plate or identifier (e.g., AP-07-TA-8822)")
    trip_id: Optional[int] = Field(None, description="Active Phase 1 Trip ID")
    latitude: float = Field(..., description="GPS Latitude in decimal degrees")
    longitude: float = Field(..., description="GPS Longitude in decimal degrees")
    speed_kmh: Optional[float] = Field(0.0, description="Speed in km/h")
    heading: Optional[float] = Field(0.0, description="Bearing angle in degrees (0-360)")
    battery_pct: Optional[int] = Field(95, description="Battery state percentage")
    status: Optional[str] = Field("IN_TRANSIT", description="STOPPED, IN_TRANSIT, DELAYED, COMPLETED")

# -----------------------------------------------------------------------------
# 1. LIVE WEBSOCKET ROUTER (BIDIRECTIONAL TELEMETRY STREAM)
# -----------------------------------------------------------------------------
@router.websocket("/ws/live")
async def websocket_telemetry_endpoint(
    websocket: WebSocket,
    trip_id: Optional[int] = Query(None)
):
    """
    Real-time WebSocket endpoint streaming continuous vehicle telemetry,
    position coordinates, heading angle, and speed to connected clients.
    """
    await websocket.accept()
    telemetry_service.register_client(websocket, trip_id=trip_id)

    # Send initial snapshot of all active vehicles upon connection
    active_vehicles = telemetry_service.get_all_active_vehicles()
    await websocket.send_json({
        "type": "SNAPSHOT",
        "active_vehicles": active_vehicles,
        "subscribed_trip_id": trip_id,
        "engine": "Redis 7.2 Pub/Sub" if telemetry_service.redis_available else "Memory Pub/Sub"
    })

    try:
        while True:
            # Keep socket alive and receive client heartbeats or client telemetry broadcasts
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    import json
                    parsed = json.loads(data)
                    if parsed.get("action") == "INGEST":
                        await telemetry_service.ingest_telemetry(parsed.get("payload", {}))
                except Exception:
                    pass
    except WebSocketDisconnect:
        telemetry_service.unregister_client(websocket, trip_id=trip_id)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        telemetry_service.unregister_client(websocket, trip_id=trip_id)

# -----------------------------------------------------------------------------
# 2. REST TELEMETRY COORDINATE INGESTION
# -----------------------------------------------------------------------------
@router.post("/ingest", status_code=status.HTTP_200_OK)
async def ingest_coordinate(payload: TelemetryIngestModel):
    """
    High-throughput REST ingestion endpoint for GPS hardware devices and field sensors.
    Writes to Redis GeoSets and broadcasts via WebSocket.
    """
    record = await telemetry_service.ingest_telemetry(payload.dict())
    return {
        "success": True,
        "message": "Telemetry coordinate ingested and broadcasted",
        "telemetry": record
    }

# -----------------------------------------------------------------------------
# 3. VEHICLE STATE & NEARBY PROXIMITY QUERIES
# -----------------------------------------------------------------------------
@router.get("/vehicles")
def get_tracked_vehicles():
    """Returns real-time locations and states of all active tracked vehicles."""
    vehicles = telemetry_service.get_all_active_vehicles()
    return {
        "status": "success",
        "count": len(vehicles),
        "vehicles": vehicles
    }

@router.get("/vehicles/{vehicle_id}")
def get_single_vehicle(vehicle_id: str):
    """Returns instantaneous telemetry of a single vehicle."""
    vehicle = telemetry_service.get_vehicle_location(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle telemetry not found")
    return {"status": "success", "vehicle": vehicle}

# -----------------------------------------------------------------------------
# 4. REAL-TIME ROUTE TELEMETRY SIMULATOR (SMOOTH MOVEMENT DRIVER)
# -----------------------------------------------------------------------------
@router.post("/simulate/{trip_id}")
async def simulate_trip_telemetry(
    trip_id: int,
    db: Session = Depends(get_db),
    vehicle_id: str = Query("AP-07-TA-8822"),
    speed_factor: float = Query(1.0, description="1.0 = real-time, 5.0 = accelerated")
):
    """
    Simulates real-time vehicle movement along a trip's road polyline,
    computing bearing headings and streaming continuous GPS updates.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    coords = trip.route_geometry or []
    if len(coords) < 2:
        # Fallback to direct path interpolation between origin and dest
        coords = [
            [trip.origin_lat, trip.origin_lon],
            [(trip.origin_lat + trip.dest_lat) / 2, (trip.origin_lon + trip.dest_lon) / 2],
            [trip.dest_lat, trip.dest_lon]
        ]

    # Spawn background simulation task
    asyncio.create_task(_run_telemetry_simulation(trip.id, vehicle_id, coords, speed_factor))

    return {
        "status": "simulation_started",
        "trip_id": trip.id,
        "vehicle_id": vehicle_id,
        "waypoints_count": len(coords),
        "message": "Telemetry simulation running along road vectors"
    }

def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates compass heading angle between two GPS points in degrees."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)
    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    theta = math.atan2(y, x)
    return (math.degrees(theta) + 360) % 360

async def _run_telemetry_simulation(
    trip_id: int,
    vehicle_id: str,
    waypoints: List[List[float]],
    speed_factor: float = 1.0
):
    """Asynchronous background worker driving GPS updates along road coordinates."""
    sleep_interval = max(0.2, 1.0 / max(0.1, speed_factor))

    for i in range(len(waypoints)):
        curr_pt = waypoints[i]
        curr_lat, curr_lon = curr_pt[0], curr_pt[1]

        # Calculate heading to next waypoint
        if i < len(waypoints) - 1:
            next_pt = waypoints[i + 1]
            heading = calculate_bearing(curr_lat, curr_lon, next_pt[0], next_pt[1])
            speed = 48.0 + (i % 5) * 2.5  # Realistic transit speed 48-60 km/h
            status_text = "IN_TRANSIT"
        else:
            heading = 0.0
            speed = 0.0
            status_text = "ARRIVED"

        telemetry = {
            "vehicle_id": vehicle_id,
            "trip_id": trip_id,
            "latitude": curr_lat,
            "longitude": curr_lon,
            "speed_kmh": speed,
            "heading": heading,
            "status": status_text,
            "battery_pct": max(45, 98 - int(i * 0.5))
        }

        await telemetry_service.ingest_telemetry(telemetry)
        await asyncio.sleep(sleep_interval)
