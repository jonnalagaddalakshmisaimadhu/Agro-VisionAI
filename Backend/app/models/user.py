from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    phone = Column(String(20))
    location = Column(String(200))
    farm_size = Column(String(50))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Profile information
    bio = Column(Text)
    profile_image = Column(String(255))
    preferred_language = Column(String(10), default="en")
    notification_preferences = Column(Text)  # JSON string
    
    # Relationships with lazy loading and string references
    products = relationship("Product", back_populates="seller", cascade="all, delete-orphan", lazy="select")
    equipment = relationship("Equipment", back_populates="owner", cascade="all, delete-orphan", lazy="select")
    rentals = relationship("Rental", back_populates="renter", cascade="all, delete-orphan", lazy="select")
    scheme_applications = relationship("SchemeApplication", back_populates="user", cascade="all, delete-orphan", lazy="select")
    disease_detections = relationship("DiseaseDetection", back_populates="user", cascade="all, delete-orphan", lazy="select")
    crop_recommendations = relationship("CropRecommendation", back_populates="user", cascade="all, delete-orphan", lazy="select")

