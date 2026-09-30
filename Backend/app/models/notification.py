from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class UserDevice(Base):
    """Stores user mobile and web device FCM push tokens."""
    __tablename__ = "user_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    fcm_token = Column(String(512), unique=True, index=True, nullable=False)
    device_type = Column(String(50), default="web")  # "android", "ios", "web"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", backref="devices")


class InAppNotification(Base):
    """Stores persistent notifications displayed in the user's In-App Bell drawer."""
    __tablename__ = "in_app_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="general")  # "weather", "disease", "transport", "market", "security"
    priority = Column(String(20), default="normal")   # "low", "normal", "high", "critical"
    action_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="in_app_notifications")


class NotificationPreference(Base):
    """User-controlled toggles and quiet hours settings."""
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    email_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    weather_alerts = Column(Boolean, default=True)
    disease_alerts = Column(Boolean, default=True)
    market_arbitrage_alerts = Column(Boolean, default=True)
    route_traffic_alerts = Column(Boolean, default=True)
    quiet_hours_enabled = Column(Boolean, default=True)
    quiet_hours_start = Column(String(10), default="22:00")
    quiet_hours_end = Column(String(10), default="06:00")
    preferred_language = Column(String(10), default="en")  # "en", "te", "hi"

    user = relationship("User", backref="notification_preference")
