from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.spatial_incident import SpatialIncident, Trip
from app.models.user import User
from app.services.routing_service import routing_service

router = APIRouter()

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------
class GeoCoordinate(BaseModel):
    lat: float
    lon: float
    name: Optional[str] = "Location"

class RouteRequest(BaseModel):
    origin: GeoCoordinate
    destination: GeoCoordinate
    profile: Optional[str] = "driving"  # "driving", "bike"
    corridor_buffer_meters: Optional[float] = 1000.0

class IncidentCreateRequest(BaseModel):
    title: str
    incident_type: str = Field(..., description="accident, congestion, road_work, hazard, weather_block")
    severity: str = Field("medium", description="low, medium, high, critical")
    latitude: float
    longitude: float
    radius_meters: Optional[float] = 150.0
    description: Optional[str] = None
    reported_by: Optional[str] = "User"

class TripStartRequest(BaseModel):
    origin: GeoCoordinate
    destination: GeoCoordinate
    distance_km: float
    duration_minutes: float
    route_polyline: Optional[List[List[float]]] = None
    user_email: Optional[str] = None

# -----------------------------------------------------------------------------
# 1. CORE ROUTING ENGINE & PATHFINDING (OSRM + INCIDENT CORRIDOR)
# -----------------------------------------------------------------------------
@router.post("/route")
async def calculate_path(payload: RouteRequest, db: Session = Depends(get_db)):
    """
    Computes optimal origin-to-destination path with OSRM turn maneuvers
    and cross-references spatial hazards within the road corridor.
    """
    route_result = await routing_service.calculate_route(
        origin_lat=payload.origin.lat,
        origin_lon=payload.origin.lon,
        dest_lat=payload.destination.lat,
        dest_lon=payload.destination.lon,
        profile=payload.profile or "driving"
    )

    if not route_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to calculate pathfinding route")

    # Fetch active incidents from database
    db_incidents = db.query(SpatialIncident).filter(SpatialIncident.is_active == True).all()
    incidents_dict = [
        {
            "id": inc.id,
            "title": inc.title,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "radius_meters": inc.radius_meters,
            "description": inc.description
        }
        for inc in db_incidents
    ]

    # Correlate hazards along the road polyline corridor
    buffer_val = payload.corridor_buffer_meters if payload.corridor_buffer_meters is not None else 1000.0
    corridor_hazards = routing_service.correlate_incidents_along_corridor(
        route_polyline=route_result.get("polyline", []),
        active_incidents=incidents_dict,
        buffer_meters=buffer_val
    )

    total_added_delay = sum(h.get("estimated_delay_minutes", 0) for h in corridor_hazards)
    adjusted_duration = round(route_result.get("duration_minutes", 0) + total_added_delay, 1)

    return {
        "status": "success",
        "routing_engine": route_result.get("source"),
        "origin": payload.origin.dict(),
        "destination": payload.destination.dict(),
        "distance_km": route_result.get("distance_km"),
        "base_duration_minutes": route_result.get("duration_minutes"),
        "adjusted_duration_minutes": adjusted_duration,
        "total_incident_delay_minutes": total_added_delay,
        "polyline": route_result.get("polyline"),
        "turn_by_turn_steps": route_result.get("steps"),
        "steps": route_result.get("steps"),
        "incidents_on_route": corridor_hazards,
        "corridor_hazards": corridor_hazards,
        "incident_count": len(corridor_hazards)
    }

# -----------------------------------------------------------------------------
# 2. SPATIAL INCIDENT DATABASE (CRUD & PROXIMITY)
# -----------------------------------------------------------------------------
@router.get("/incidents")
def get_active_incidents(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius_km: Optional[float] = 50.0,
    db: Session = Depends(get_db)
):
    """Retrieves all active spatial incidents, with optional proximity radius filtering."""
    query = db.query(SpatialIncident).filter(SpatialIncident.is_active == True)
    incidents = query.order_by(SpatialIncident.created_at.desc()).all()

    results = []
    for inc in incidents:
        inc_data = {
            "id": inc.id,
            "title": inc.title,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "radius_meters": inc.radius_meters,
            "description": inc.description,
            "reported_by": inc.reported_by,
            "created_at": inc.created_at.isoformat() if inc.created_at else None
        }

        if lat is not None and lon is not None:
            dist = routing_service.haversine_distance_km(lat, lon, inc.latitude, inc.longitude)
            inc_data["distance_from_user_km"] = round(dist, 2)
            if dist <= (radius_km or 50.0):
                results.append(inc_data)
        else:
            results.append(inc_data)

    return {
        "status": "success",
        "count": len(results),
        "incidents": results
    }

@router.post("/incidents", status_code=status.HTTP_201_CREATED)
def report_incident(payload: IncidentCreateRequest, db: Session = Depends(get_db)):
    """Creates a new spatial incident/hazard with geolocated coordinates."""
    incident = SpatialIncident(
        title=payload.title,
        incident_type=payload.incident_type,
        severity=payload.severity,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_meters=payload.radius_meters or 150.0,
        description=payload.description,
        reported_by=payload.reported_by or "user",
        is_active=True
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return {"success": True, "message": "Spatial incident registered", "incident_id": incident.id}

# -----------------------------------------------------------------------------
# 3. ORIGIN-TO-DESTINATION TRIP LIFECYCLE
# -----------------------------------------------------------------------------
@router.post("/trips/start", status_code=status.HTTP_201_CREATED)
def start_trip(payload: TripStartRequest, db: Session = Depends(get_db)):
    """Initializes and records a new active navigation trip."""
    user = None
    if payload.user_email:
        user = db.query(User).filter(User.email == payload.user_email).first()

    trip = Trip(
        user_id=user.id if user else None,
        origin_name=payload.origin.name or "Origin",
        origin_lat=payload.origin.lat,
        origin_lon=payload.origin.lon,
        dest_name=payload.destination.name or "Destination",
        dest_lat=payload.destination.lat,
        dest_lon=payload.destination.lon,
        distance_km=payload.distance_km,
        duration_minutes=payload.duration_minutes,
        route_geometry=payload.route_polyline,
        status="IN_PROGRESS"
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return {"success": True, "trip_id": trip.id, "status": "IN_PROGRESS"}

@router.put("/trips/{trip_id}/complete")
def complete_trip(trip_id: int, db: Session = Depends(get_db)):
    """Marks an active trip as completed."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip record not found")

    trip.status = "COMPLETED"
    trip.completed_at = datetime.utcnow()
    db.commit()
    return {"success": True, "trip_id": trip.id, "status": "COMPLETED"}

@router.get("/trips/active")
def get_active_trip(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    """Recovers the active in-progress trip to maintain navigation continuity across restarts."""
    query = db.query(Trip).filter(Trip.status == "IN_PROGRESS")
    if user_email:
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            query = query.filter(Trip.user_id == user.id)

    trip = query.order_by(Trip.created_at.desc()).first()
    if not trip:
        return {"has_active_trip": False}

    return {
        "has_active_trip": True,
        "trip_id": trip.id,
        "origin": {"name": trip.origin_name, "lat": trip.origin_lat, "lon": trip.origin_lon},
        "destination": {"name": trip.dest_name, "lat": trip.dest_lat, "lon": trip.dest_lon},
        "distance_km": trip.distance_km,
        "duration_minutes": trip.duration_minutes,
        "polyline": trip.route_geometry,
        "status": trip.status,
        "started_at": trip.created_at.isoformat() if trip.created_at else None
    }

@router.get("/trips/history")
def get_trip_history(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetches user trip history and total kilometers traveled."""
    query = db.query(Trip)
    if user_email:
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            query = query.filter(Trip.user_id == user.id)

    trips = query.order_by(Trip.created_at.desc()).limit(20).all()
    total_km = sum(t.distance_km for t in trips if t.distance_km)

    return {
        "total_trips": len(trips),
        "total_distance_km": round(total_km, 2),
        "trips": [
            {
                "id": t.id,
                "origin": t.origin_name,
                "destination": t.dest_name,
                "distance_km": t.distance_km,
                "duration_minutes": t.duration_minutes,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None
            }
            for t in trips
        ]
    }
