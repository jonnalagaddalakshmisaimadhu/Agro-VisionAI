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
from app.schemas.user import TokenData
from app.core.security import verify_token, verify_token_optional
from app.services.disease_detection import disease_detection_service
from app.services.weather import weather_service
from typing import List, Optional
import json
import base64
import os
import uuid
from pathlib import Path

router = APIRouter()

@router.post("/predict-test", response_model=DiseaseDetectionResponse)
async def predict_disease_test(
    request: DiseaseDetectionRequest,
    current_token: Optional[TokenData] = Depends(verify_token_optional),
    db: Session = Depends(get_db)
):
    """Alias for predict_disease for testing purposes."""
    return await predict_disease(request, current_token, db)

@router.post("/predict", response_model=DiseaseDetectionResponse)
async def predict_disease(
    request: DiseaseDetectionRequest,
    current_token: Optional[TokenData] = Depends(verify_token_optional),
    db: Session = Depends(get_db)
):
    """Predict disease and save results to the database."""
    try:
        # Get user ID if token is valid
        user_id = None
        if current_token:
            user = db.query(User).filter(User.username == current_token.username).first()
            if user:
                user_id = user.id
                
        # 1. Get prediction from service
        prediction_result = disease_detection_service.predict_disease(
            request.image_base64
        )
        
        # 2. Save image to disk
        try:
            image_data = request.image_base64
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_binary = base64.b64decode(image_data)
            
            # Create filename and path
            filename = f"{uuid.uuid4()}.jpg"
            upload_dir = Path("uploads/detections")
            upload_dir.mkdir(parents=True, exist_ok=True)
            image_path = upload_dir / filename
            
            with open(image_path, "wb") as f:
                f.write(image_binary)
                
            db_image_path = str(image_path)
        except Exception as e:
            print(f"DEBUG: Failed to save image: {e}")
            db_image_path = "placeholder.jpg"

        # 3. Save to database
        new_detection = DiseaseDetection(
            user_id=user_id,
            crop_type="Plant",  # Can be extracted from prediction if needed
            image_path=db_image_path,
            disease_name=prediction_result["disease_name"],
            confidence_score=prediction_result["confidence_score"],
            severity=prediction_result["severity"],
            symptoms=json.dumps(prediction_result["symptoms"]),
            treatment=json.dumps(prediction_result["treatment"]),
            prevention=json.dumps(prediction_result["prevention"]),
            is_verified=False
        )
        
        db.add(new_detection)
        db.commit()
        db.refresh(new_detection)
        
        # Format for response manually to avoid from_orm validation issues with JSON strings
        return DiseaseDetectionResponse(
            id=new_detection.id,
            crop_type=new_detection.crop_type,
            disease_name=new_detection.disease_name,
            confidence_score=new_detection.confidence_score,
            severity=new_detection.severity,
            symptoms=prediction_result["symptoms"],
            treatment=prediction_result["treatment"],
            prevention=prediction_result["prevention"],
            description=prediction_result.get("description", ""),
            is_verified=new_detection.is_verified,
            expert_comment=new_detection.expert_comment,
            created_at=new_detection.created_at
        )
        
    except Exception as e:
        print(f"DEBUG: Error in predict_disease: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing disease detection: {str(e)}"
        )

@router.get("/detections", response_model=List[DiseaseDetectionResponse])
async def list_detections(
    current_token: TokenData = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """List all user's detections (alias for history)."""
    user = db.query(User).filter(User.username == current_token.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    detections = db.query(DiseaseDetection).filter(
        DiseaseDetection.user_id == user.id
    ).all()
    
    for detection in detections:
        if isinstance(detection.symptoms, str):
            detection.symptoms = json.loads(detection.symptoms)
        if isinstance(detection.treatment, str):
            detection.treatment = json.loads(detection.treatment)
        if isinstance(detection.prevention, str):
            detection.prevention = json.loads(detection.prevention)
            
    return detections


@router.get("/history", response_model=List[DiseaseDetectionResponse])
async def get_detection_history(
    current_token: TokenData = Depends(verify_token),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get user's disease detection history."""
    user = db.query(User).filter(User.username == current_token.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    detections = db.query(DiseaseDetection).filter(
        DiseaseDetection.user_id == user.id
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
    current_token: TokenData = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get AI-powered crop recommendations."""
    try:
        user = db.query(User).filter(User.username == current_token.username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
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
            user_id=user.id,
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
    current_token: TokenData = Depends(verify_token),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get user's crop recommendation history."""
    user = db.query(User).filter(User.username == current_token.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    recommendations = db.query(CropRecommendation).filter(
        CropRecommendation.user_id == user.id
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
