import asyncio
import logging
import random
import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.services.map_matching import map_matching_engine, DEFAULT_ROAD_LINKS
from app.services.traffic_prediction_engine import traffic_prediction_engine
from app.services.stream_processing import stream_processor

logger = logging.getLogger(__name__)

router = APIRouter()

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------
class PredictTrafficRequest(BaseModel):
    link_id: Optional[str] = Field(None, description="Road link ID (e.g. LINK-NH16-01)")
    latitude: Optional[float] = Field(None, description="GPS Latitude in decimal degrees")
    longitude: Optional[float] = Field(None, description="GPS Longitude in decimal degrees")
    lead_time_minutes: int = Field(15, description="Forecast horizon in minutes (15, 30, 60, 120)")
    weather_severity: float = Field(0.0, ge=0.0, le=1.0, description="0.0 (Clear) to 1.0 (Severe storm/waterlogged)")
    rainfall_mm: float = Field(0.0, ge=0.0, description="Precipitation rate mm/h")
    market_rush_index: float = Field(0.0, ge=0.0, le=1.0, description="Crowd/mandi harvest surge 0.0 to 1.0")
    current_speed_kmh: Optional[float] = Field(None, description="Live observed vehicle speed")

class SingleCoordMapMatchRequest(BaseModel):
    latitude: float = Field(..., description="GPS Latitude")
    longitude: float = Field(..., description="GPS Longitude")
    heading: Optional[float] = Field(None, description="Compass bearing (0-360)")
    speed_kmh: Optional[float] = Field(None, description="Observed speed in km/h")
    vehicle_id: Optional[str] = Field("TRK-01", description="Vehicle identifier")

class BreadcrumbTrajectoryRequest(BaseModel):
    breadcrumbs: List[SingleCoordMapMatchRequest] = Field(..., description="List of sequential GPS points")

class TelemetryBatchIngestRequest(BaseModel):
    batch: List[Dict[str, Any]] = Field(..., description="High-frequency telemetry micro-batch")


# -----------------------------------------------------------------------------
# 1. AI/ML TRAFFIC PREDICTION ENDPOINTS
# -----------------------------------------------------------------------------
@router.post("/predict", status_code=status.HTTP_200_OK)
def predict_traffic_congestion(req: PredictTrafficRequest):
    """
    Dual-Engine AI/ML Traffic Prediction (XGBoost + PyTorch ST-GNN).
    Forecasts road link traversal speed, congestion index, and ETA delay
    ahead of time based on weather, crowd surge, and diurnal patterns.
    """
    target_link_id = req.link_id

    # If coordinates provided instead of link_id, snap to nearest road link first
    if not target_link_id and req.latitude is not None and req.longitude is not None:
        match = map_matching_engine.match_coordinate(
            lat=req.latitude,
            lon=req.longitude,
            speed_kmh=req.current_speed_kmh
        )
        target_link_id = match.get("link_id")

    if not target_link_id or target_link_id not in traffic_prediction_engine.LINK_INDEX_MAP:
        target_link_id = "LINK-NH16-01"  # Default fallback corridor

    # Retrieve corridor attributes
    corridor_state = stream_processor.get_single_corridor(target_link_id)
    speed_limit = corridor_state["speed_limit_kmh"] if corridor_state else 80.0
    current_speed = req.current_speed_kmh or (corridor_state["current_speed_kmh"] if corridor_state else speed_limit * 0.8)

    now = time.localtime()
    prediction = traffic_prediction_engine.predict_link_speed(
        link_id=target_link_id,
        hour=now.tm_hour,
        day=now.tm_wday,
        weather_severity=req.weather_severity,
        rainfall_mm=req.rainfall_mm,
        market_rush_index=req.market_rush_index,
        current_speed=current_speed,
        speed_limit=speed_limit,
        lead_time_minutes=float(req.lead_time_minutes)
    )

    return {
        "status": "success",
        "link_id": target_link_id,
        "corridor_name": corridor_state["name"] if corridor_state else "Primary Transit Link",
        "prediction": prediction
    }

@router.get("/predict-all-horizons/{link_id}")
def predict_all_horizons(
    link_id: str,
    weather_severity: float = Query(0.0, ge=0.0, le=1.0),
    market_rush_index: float = Query(0.0, ge=0.0, le=1.0)
):
    """
    Returns multi-horizon (+15m, +30m, +60m, +120m) forecasts for a corridor.
    """
    corridor_state = stream_processor.get_single_corridor(link_id)
    if not corridor_state:
        raise HTTPException(status_code=404, detail="Road link corridor not found")

    result = traffic_prediction_engine.predict_multi_horizon(
        link_id=link_id,
        current_speed=corridor_state["current_speed_kmh"],
        speed_limit=corridor_state["speed_limit_kmh"],
        weather_severity=weather_severity,
        market_rush_index=market_rush_index
    )

    return {
        "status": "success",
        "corridor": corridor_state["name"],
        "data": result
    }


# -----------------------------------------------------------------------------
# 2. ROAD LINK MAP-MATCHING ENDPOINTS
# -----------------------------------------------------------------------------
@router.post("/map-match")
def map_match_point(req: SingleCoordMapMatchRequest):
    """
    Snaps a raw noisy GPS coordinate to the nearest OpenStreetMap road link centerline.
    Returns matched road link, cross-track error in meters, and confidence score.
    """
    match = map_matching_engine.match_coordinate(
        lat=req.latitude,
        lon=req.longitude,
        heading=req.heading,
        speed_kmh=req.speed_kmh
    )
    return {
        "status": "success",
        "vehicle_id": req.vehicle_id,
        "match": match
    }

@router.post("/map-match-trajectory")
def map_match_trajectory(req: BreadcrumbTrajectoryRequest):
    """
    Snaps a sequence of GPS trajectory breadcrumbs with jitter filtering.
    """
    pings = [b.dict() for b in req.breadcrumbs]
    snapped = map_matching_engine.match_trajectory(pings)
    return {
        "status": "success",
        "total_points": len(snapped),
        "trajectory": snapped
    }


# -----------------------------------------------------------------------------
# 3. CORRIDOR REAL-TIME STATES & STREAM METRICS
# -----------------------------------------------------------------------------
@router.get("/corridors")
def get_monitored_corridors():
    """
    Returns all monitored road corridors with real-time rolling speeds,
    congestion classifications, and AI forward predictions.
    """
    corridors = stream_processor.get_corridor_states()
    return {
        "status": "success",
        "count": len(corridors),
        "corridors": corridors
    }

@router.get("/corridors/{link_id}")
def get_single_corridor_detail(link_id: str):
    """Returns detailed state of a specific road corridor."""
    corridor = stream_processor.get_single_corridor(link_id)
    if not corridor:
        raise HTTPException(status_code=404, detail="Corridor not found")
    return {
        "status": "success",
        "corridor": corridor
    }

@router.get("/stream/stats")
def get_stream_processing_statistics():
    """
    Returns Kafka / Faust stream processor real-time metrics,
    throughput (events/sec), micro-batch latency, and queue health.
    """
    metrics = stream_processor.get_stream_metrics()
    return {
        "status": "success",
        "metrics": metrics
    }

@router.post("/stream/batch")
async def ingest_stream_batch(payload: TelemetryBatchIngestRequest):
    """
    Directly ingests a high-frequency telemetry micro-batch into stream processing pipeline.
    """
    res = await stream_processor.ingest_batch(payload.batch)
    return res


# -----------------------------------------------------------------------------
# 4. LIVE STREAM SIMULATOR (DEMONSTRATES STREAM INGESTION & AI IN REAL TIME)
# -----------------------------------------------------------------------------
@router.post("/simulate-stream")
async def start_stream_simulation(
    num_pings: int = Query(30, ge=10, le=120, description="Number of GPS pings to generate"),
    congestion_bias: str = Query("RUSH_HOUR", description="NORMAL, RUSH_HOUR, MONSOON_STORM")
):
    """
    Generates and processes a realistic stream of vehicle GPS breadcrumbs across
    monitored road corridors, demonstrating high-frequency batching and live AI predictions.
    """
    asyncio.create_task(_run_simulated_stream_worker(num_pings, congestion_bias))
    return {
        "status": "simulation_initiated",
        "num_pings": num_pings,
        "congestion_bias": congestion_bias,
        "message": "Real-time stream micro-batch ingestion triggered"
    }

async def _run_simulated_stream_worker(num_pings: int, bias: str):
    """Generates synthetic high-frequency GPS batches matching onto road links."""
    vehicles = [f"AP-07-TK-{random.randint(1000, 9999)}" for _ in range(8)]
    links = DEFAULT_ROAD_LINKS

    for step in range(0, num_pings, 5):
        micro_batch = []
        for _ in range(min(5, num_pings - step)):
            target_link = random.choice(links)
            coords = target_link["coordinates"]
            idx = random.randint(0, len(coords) - 1)
            base_pt = coords[idx]

            # Add noisy jitter (simulate real-world GPS noise: ~5-15 meters)
            lat_jitter = random.uniform(-0.00015, 0.00015)
            lon_jitter = random.uniform(-0.00015, 0.00015)

            # Determine speed based on bias
            limit = target_link["speed_limit_kmh"]
            if bias == "RUSH_HOUR":
                speed = random.uniform(limit * 0.25, limit * 0.55)
            elif bias == "MONSOON_STORM":
                speed = random.uniform(limit * 0.15, limit * 0.40)
            else:
                speed = random.uniform(limit * 0.70, limit * 0.95)

            ping = {
                "vehicle_id": random.choice(vehicles),
                "latitude": base_pt[0] + lat_jitter,
                "longitude": base_pt[1] + lon_jitter,
                "speed_kmh": round(speed, 1),
                "heading": random.uniform(0, 360),
                "timestamp": time.time()
            }
            micro_batch.append(ping)

        await stream_processor.ingest_batch(micro_batch)
        await asyncio.sleep(0.4)


# -----------------------------------------------------------------------------
# 5. WEBSOCKET REAL-TIME STREAMING
# -----------------------------------------------------------------------------
@router.websocket("/ws/stream")
async def websocket_traffic_stream(websocket: WebSocket):
    """
    Continuous real-time WebSocket connection pushing stream processing batches,
    map-matched breadcrumbs, and live corridor AI forecasts to connected apps.
    """
    await websocket.accept()
    stream_processor.register_subscriber(websocket)

    # Send initial snapshot of all corridors and metrics
    corridors = stream_processor.get_corridor_states()
    metrics = stream_processor.get_stream_metrics()

    await websocket.send_json({
        "type": "INITIAL_SNAPSHOT",
        "corridors": corridors,
        "metrics": metrics,
        "engine_info": {
            "prediction_models": "XGBoost 3.2 + PyTorch ST-GNN",
            "stream_processor": "Faust-Streaming + Kafka/Redpanda API",
            "map_matcher": "Cross-Track Geometric Projection"
        }
    })

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        stream_processor.unregister_subscriber(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client disconnected: {e}")
        stream_processor.unregister_subscriber(websocket)
