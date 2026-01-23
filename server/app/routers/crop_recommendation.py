from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.disease_detection import CropRecommendation
from app.models.user import User
from app.schemas.disease_detection import CropRecommendationRequest, CropRecommendationResponse
from app.core.security import verify_token
from app.services.weather import weather_service
from typing import List
import json

router = APIRouter()

@router.post("/recommend", response_model=CropRecommendationResponse)
async def get_crop_recommendation(
    request: CropRecommendationRequest,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get AI-powered crop recommendations based on location and conditions."""
    try:
        # Get weather data for the location
        weather_data = await weather_service.get_weather_by_city(request.location)
        farming_recommendations = weather_service.get_farming_recommendations(weather_data)
        
        # Generate crop recommendations based on conditions
        recommended_crops = generate_crop_recommendations(
            request, weather_data, farming_recommendations
        )
        
        # Save recommendation to database
        recommendation = CropRecommendation(
            user_id=current_user.id,
            location=request.location,
            soil_type=request.soil_type,
            farm_size=request.farm_size,
            budget=request.budget,
            season=request.season,
            previous_crop=request.previous_crop,
            recommended_crops=json.dumps(recommended_crops),
            weather_data=json.dumps(weather_data)
        )
        
        db.add(recommendation)
        db.commit()
        db.refresh(recommendation)
        
        # Convert JSON strings back to objects
        recommendation.recommended_crops = json.loads(recommendation.recommended_crops)
        recommendation.weather_data = json.loads(recommendation.weather_data)
        
        return recommendation
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating crop recommendations: {str(e)}"
        )

def generate_crop_recommendations(request: CropRecommendationRequest, weather_data: dict, farming_recommendations: dict) -> List[dict]:
    """Generate crop recommendations based on various factors."""
    temp = weather_data.get("main", {}).get("temp", 25)
    humidity = weather_data.get("main", {}).get("humidity", 60)
    
    # Base recommendations
    recommendations = []
    
    # High-value crops for good conditions
    if temp >= 20 and temp <= 30 and humidity >= 40:
        recommendations.extend([
            {
                "crop": "Tomato",
                "profitability": "High",
                "yield": "25-30 tons/hectare",
                "investment": "₹50,000",
                "duration": "90-120 days",
                "market_price": "₹45/kg",
                "reasons": ["High market demand", "Suitable weather conditions", "Good profit margin"],
                "suitability_score": 0.9
            },
            {
                "crop": "Bell Pepper",
                "profitability": "High",
                "yield": "20-25 tons/hectare",
                "investment": "₹60,000",
                "duration": "100-120 days",
                "market_price": "₹60/kg",
                "reasons": ["High export demand", "Good weather match", "Premium pricing"],
                "suitability_score": 0.85
            }
        ])
    
    # Medium-value crops for moderate conditions
    if temp >= 15 and temp <= 35:
        recommendations.extend([
            {
                "crop": "Wheat",
                "profitability": "Medium",
                "yield": "4-5 tons/hectare",
                "investment": "₹25,000",
                "duration": "120-150 days",
                "market_price": "₹22/kg",
                "reasons": ["Stable market", "Government support", "Low maintenance"],
                "suitability_score": 0.7
            },
            {
                "crop": "Maize",
                "profitability": "Medium",
                "yield": "6-8 tons/hectare",
                "investment": "₹30,000",
                "duration": "100-120 days",
                "market_price": "₹18/kg",
                "reasons": ["Good yield potential", "Multiple uses", "Market stability"],
                "suitability_score": 0.75
            }
        ])
    
    # Soil-specific recommendations
    if request.soil_type:
        if request.soil_type.lower() == "loam":
            recommendations.append({
                "crop": "Cotton",
                "profitability": "High",
                "yield": "2-3 tons/hectare",
                "investment": "₹40,000",
                "duration": "180-200 days",
                "market_price": "₹60/kg",
                "reasons": ["Ideal soil type", "Export potential", "Good pricing"],
                "suitability_score": 0.8
            })
        elif request.soil_type.lower() == "clay":
            recommendations.append({
                "crop": "Rice",
                "profitability": "Medium",
                "yield": "4-6 tons/hectare",
                "investment": "₹35,000",
                "duration": "120-150 days",
                "market_price": "₹30/kg",
                "reasons": ["Clay soil suitable", "High demand", "Government support"],
                "suitability_score": 0.8
            })
    
    # Season-specific recommendations
    if request.season:
        if request.season.lower() == "kharif":
            recommendations.extend([
                {
                    "crop": "Sugarcane",
                    "profitability": "High",
                    "yield": "80-100 tons/hectare",
                    "investment": "₹60,000",
                    "duration": "12-18 months",
                    "market_price": "₹3,000/ton",
                    "reasons": ["Kharif season crop", "High yield", "Stable market"],
                    "suitability_score": 0.85
                }
            ])
        elif request.season.lower() == "rabi":
            recommendations.extend([
                {
                    "crop": "Mustard",
                    "profitability": "Medium",
                    "yield": "1.5-2 tons/hectare",
                    "investment": "₹20,000",
                    "duration": "120-140 days",
                    "market_price": "₹4,500/ton",
                    "reasons": ["Rabi season crop", "Oil seed demand", "Good returns"],
                    "suitability_score": 0.75
                }
            ])
    
    # Budget-based filtering
    if request.budget:
        recommendations = [rec for rec in recommendations if int(rec["investment"].replace("₹", "").replace(",", "")) <= request.budget]
    
    # Sort by suitability score and return top 5
    recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
    return recommendations[:5]

@router.get("/recommendations", response_model=List[CropRecommendationResponse])
async def get_crop_recommendation_history(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get user's crop recommendation history."""
    recommendations = db.query(CropRecommendation).filter(
        CropRecommendation.user_id == current_user.id
    ).order_by(CropRecommendation.created_at.desc()).limit(limit).all()
    
    # Convert JSON strings back to objects
    for rec in recommendations:
        if rec.recommended_crops:
            rec.recommended_crops = json.loads(rec.recommended_crops)
        if rec.weather_data:
            rec.weather_data = json.loads(rec.weather_data)
    
    return recommendations

@router.get("/crops")
async def get_available_crops():
    """Get list of available crops for recommendation."""
    return {
        "crops": [
            {"name": "Tomato", "category": "Vegetables", "season": "All"},
            {"name": "Wheat", "category": "Cereals", "season": "Rabi"},
            {"name": "Rice", "category": "Cereals", "season": "Kharif"},
            {"name": "Maize", "category": "Cereals", "season": "Kharif"},
            {"name": "Cotton", "category": "Fiber", "season": "Kharif"},
            {"name": "Sugarcane", "category": "Cash Crop", "season": "Kharif"},
            {"name": "Mustard", "category": "Oil Seeds", "season": "Rabi"},
            {"name": "Bell Pepper", "category": "Vegetables", "season": "All"},
            {"name": "Onion", "category": "Vegetables", "season": "Rabi"},
            {"name": "Potato", "category": "Vegetables", "season": "Rabi"}
        ]
    }
