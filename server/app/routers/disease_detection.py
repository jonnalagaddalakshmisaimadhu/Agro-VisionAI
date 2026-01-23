from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.disease_detection import DiseaseDetection, CropRecommendation
from app.models.user import User
from app.schemas.disease_detection import (
    DiseaseDetectionRequest, 
    DiseaseDetectionResponse,
    CropRecommendationRequest,
    CropRecommendationResponse
)
from app.core.security import verify_token
from app.services.disease_detection import disease_detection_service
from app.services.weather import weather_service
from typing import List
import json

router = APIRouter()

@router.post("/predict-test")
async def predict_disease_test(request: DiseaseDetectionRequest):
    """Predict disease from plant image (test endpoint without authentication)."""
    try:
        # Get disease prediction from ML service
        prediction_result = disease_detection_service.predict_disease(
            request.image_base64
        )
        
        # Debug logging
        print(f"Prediction result: {prediction_result}")
        print(f"Confidence score: {prediction_result['confidence_score']}")
        
        return {
            "disease_name": prediction_result["disease_name"],
            "confidence_score": prediction_result["confidence_score"],
            "severity": prediction_result["severity"],
            "symptoms": prediction_result["symptoms"],
            "treatment": prediction_result["treatment"],
            "prevention": prediction_result["prevention"]
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing disease detection: {str(e)}"
        )


@router.get("/history", response_model=List[DiseaseDetectionResponse])
async def get_detection_history(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get user's disease detection history."""
    detections = db.query(DiseaseDetection).filter(
        DiseaseDetection.user_id == current_user.id
    ).order_by(DiseaseDetection.created_at.desc()).limit(limit).all()
    
    # Convert JSON strings back to lists
    for detection in detections:
        if detection.symptoms:
            detection.symptoms = json.loads(detection.symptoms)
        if detection.treatment:
            detection.treatment = json.loads(detection.treatment)
        if detection.prevention:
            detection.prevention = json.loads(detection.prevention)
    
    return detections

@router.post("/crop-recommendation", response_model=CropRecommendationResponse)
async def get_crop_recommendation(
    request: CropRecommendationRequest,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get AI-powered crop recommendations."""
    try:
        # Get weather data for the location
        weather_data = await weather_service.get_weather_by_city(request.location)
        farming_recommendations = weather_service.get_farming_recommendations(weather_data)
        
        # Mock crop recommendations (in production, this would use ML models)
        recommended_crops = [
            {
                "crop": "Tomato",
                "profitability": "High",
                "yield": "25-30 tons/hectare",
                "investment": "₹50,000",
                "duration": "90-120 days",
                "market_price": "₹45/kg",
                "reasons": ["High market demand", "Suitable soil conditions", "Favorable weather"]
            },
            {
                "crop": "Wheat",
                "profitability": "Medium",
                "yield": "4-5 tons/hectare",
                "investment": "₹25,000",
                "duration": "120-150 days",
                "market_price": "₹22/kg",
                "reasons": ["Stable market", "Low maintenance", "Government support"]
            }
        ]
        
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

@router.get("/crop-recommendations", response_model=List[CropRecommendationResponse])
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

@router.get("/available-crops")
async def get_available_crops():
    """Get list of crops supported for disease detection."""
    return {
        "available_crops": ["Plant"],  # Single model supports all plants
        "total_models": 1 if disease_detection_service.model is not None else 0
    }
