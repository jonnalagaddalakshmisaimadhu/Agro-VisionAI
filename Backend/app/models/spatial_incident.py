from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class SpatialIncident(Base):
    """
    Spatial Incident entity for storing road hazards, traffic bottlenecks,
    accidents, and temporary blockages with spatial coordinates.
    """
    __tablename__ = "spatial_incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    incident_type = Column(String(50), index=True, nullable=False)  # "accident", "congestion", "road_work", "hazard", "weather_block"
    severity = Column(String(20), default="medium", index=True)    # "low", "medium", "high", "critical"
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    radius_meters = Column(Float, default=150.0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    reported_by = Column(String(100), default="automated_sensor")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)


class Trip(Base):
    """
    Origin-to-Destination trip entity tracking planned and active journeys,
    road distances, durations, and geometry polylines.
    """
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    origin_name = Column(String(200), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    dest_name = Column(String(200), nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lon = Column(Float, nullable=False)
    distance_km = Column(Float, default=0.0)
    duration_minutes = Column(Float, default=0.0)
    route_geometry = Column(JSON, nullable=True)  # GeoJSON coordinate points [[lat, lon], ...]
    status = Column(String(30), default="PLANNED", index=True)  # "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="trips")
