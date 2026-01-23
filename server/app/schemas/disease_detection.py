from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DiseaseDetectionRequest(BaseModel):
    image_base64: str

class DiseaseDetectionResponse(BaseModel):
    id: int
    crop_type: str
    disease_name: Optional[str] = None
    confidence_score: Optional[float] = None
    severity: Optional[str] = None
    symptoms: Optional[List[str]] = None
    treatment: Optional[List[str]] = None
    prevention: Optional[List[str]] = None
    is_verified: bool
    expert_comment: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class CropRecommendationRequest(BaseModel):
    location: str
    soil_type: Optional[str] = None
    farm_size: Optional[float] = None
    budget: Optional[float] = None
    season: Optional[str] = None
    previous_crop: Optional[str] = None

class CropRecommendationResponse(BaseModel):
    id: int
    location: str
    soil_type: Optional[str] = None
    farm_size: Optional[float] = None
    budget: Optional[float] = None
    season: Optional[str] = None
    previous_crop: Optional[str] = None
    recommended_crops: Optional[List[dict]] = None
    weather_data: Optional[dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
