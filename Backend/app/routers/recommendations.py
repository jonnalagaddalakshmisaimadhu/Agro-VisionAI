from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.recommendation_engine import recommendation_engine
from datetime import datetime

router = APIRouter()


class RecommendationRequest(BaseModel):
    district: str = Field(..., description="District or region name")
    area_ha: float = Field(..., gt=0, description="Farm area in hectares")
    season: str = Field(..., description="Kharif, Rabi, or Summer")
    lat: Optional[float] = Field(None, description="Latitude for precise location")
    lon: Optional[float] = Field(None, description="Longitude for precise location")
    desired_crops: Optional[List[str]] = None
    budget: Optional[float] = Field(None, description="Budget in ₹")


class CropRecommendation(BaseModel):
    crop: str
    category: Optional[str] = "General"
    profitability: str
    revenue: float
    investment: float
    profit: float
    profit_per_ha: float
    yield_t_per_ha: float
    duration_days: tuple
    price_per_kg: float
    price_per_quintal: float
    break_even_price_per_kg: Optional[float] = None
    break_even_price_per_quintal: Optional[float] = None
    roi_percent: Optional[float] = None
    bc_ratio: Optional[float] = None
    cost_breakdown: Optional[Dict[str, float]] = None
    scenarios: Optional[Dict[str, Any]] = None
    suitability_score: float
    profit_score: float
    soil_match: float
    season_match: float
    final_score: float
    explanation: List[str]
    risk: str
    water_requirement: str


class RecommendationResponse(BaseModel):
    request_id: str
    status: str
    location: dict
    area_ha: float
    season: str
    recommendations: List[CropRecommendation]
    metadata: dict


@router.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Get AI-powered crop recommendations with real-time market prices and profit analysis
    across ALL categories (Vegetables, Fruits, Grains, Pulses, Oilseeds, Spices, Cash Crops).
    """
    try:
        result = await recommendation_engine.get_recommendations(
            district=request.district,
            area_ha=request.area_ha,
            season=request.season,
            db=db,
            desired_crops=request.desired_crops,
            lat=request.lat,
            lon=request.lon,
            budget=request.budget
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


@router.get("/recommendations/health")
async def health_check():
    """Health check for recommendations service."""
    return {
        "status": "healthy",
        "service": "crop-recommendations",
        "timestamp": datetime.utcnow().isoformat()
    }
