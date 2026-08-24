from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class DiseaseDetection(Base):
    __tablename__ = "disease_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    crop_type = Column(String(50), nullable=False)
    image_path = Column(String(255), nullable=False)
    disease_name = Column(String(100))
    confidence_score = Column(Float)
    severity = Column(String(20))  # low, medium, high
    symptoms = Column(Text)  # JSON string
    treatment = Column(Text)  # JSON string
    prevention = Column(Text)  # JSON string
    is_verified = Column(Boolean, default=False)
    expert_comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="disease_detections")

class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location = Column(String(200), nullable=False)
    soil_type = Column(String(50))
    farm_size = Column(Float)
    budget = Column(Float)
    season = Column(String(20))
    previous_crop = Column(String(100))
    recommended_crops = Column(Text)  # JSON string
    weather_data = Column(Text)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="crop_recommendations")

