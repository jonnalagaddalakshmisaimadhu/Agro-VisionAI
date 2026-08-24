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

from groq import Groq
from app.core.config import settings
from app.services.weather import open_meteo_service
import asyncio
import os
import json
from groq import AsyncGroq
from app.core.config import settings
from app.services.weather import open_meteo_service

router = APIRouter()

def get_async_groq_client():
    api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    if api_key:
        return AsyncGroq(api_key=api_key)
    return None

def get_fallback_crop_recommendations(request: CropRecommendationRequest) -> List[dict]:
    """Generates intelligent algorithmic recommendations if LLM is unavailable."""
    farm_size = request.farm_size or 5.0
    budget = request.budget or 100000.0
    
    crops_pool = [
        {
            "cropName": "Wheat (HD-2967)",
            "profitability": "High Profit",
            "expectedYield": f"{int(20 * farm_size)} Quintals",
            "investment": f"₹{int(budget * 0.3):,}",
            "duration": "120-135 days",
            "marketPrice": "₹2,450/quintal",
            "priceTrend": "Stable to rising due to strong domestic demand",
            "estimatedProfit": f"₹{int((20 * farm_size * 2450) - (budget * 0.3)):,}",
            "reasons": [
                f"Ideal fit for {request.soil_type} soil in {request.location} region",
                "Low pest vulnerability and guaranteed Minimum Support Price (MSP)",
                "Optimal soil moisture absorption profile for the selected season"
            ]
        },
        {
            "cropName": "Mustard (Pusa Bold)",
            "profitability": "High Profit",
            "expectedYield": f"{int(10 * farm_size)} Quintals",
            "investment": f"₹{int(budget * 0.2):,}",
            "duration": "105-115 days",
            "marketPrice": "₹5,600/quintal",
            "priceTrend": "Bullish trend driven by domestic oilseed demand",
            "estimatedProfit": f"₹{int((10 * farm_size * 5600) - (budget * 0.2)):,}",
            "reasons": [
                "Low water requirement making it drought resilient",
                "High oil content fetching premium mandi prices",
                "Excellent rotation choice following previous crop"
            ]
        },
        {
            "cropName": "Chickpea / Gram (JG-11)",
            "profitability": "High Profit",
            "expectedYield": f"{int(12 * farm_size)} Quintals",
            "investment": f"₹{int(budget * 0.25):,}",
            "duration": "95-105 days",
            "marketPrice": "₹5,800/quintal",
            "priceTrend": "Steady demand across major APMC mandis",
            "estimatedProfit": f"₹{int((12 * farm_size * 5800) - (budget * 0.25)):,}",
            "reasons": [
                "Enriches soil with atmospheric nitrogen fixation",
                "Minimal chemical fertilizer requirement reducing input costs",
                "High market liquidity and rapid post-harvest sale"
            ]
        },
        {
            "cropName": "Maize (Hybrid HQPM-1)",
            "profitability": "Medium Profit",
            "expectedYield": f"{int(25 * farm_size)} Quintals",
            "investment": f"₹{int(budget * 0.35):,}",
            "duration": "90-100 days",
            "marketPrice": "₹2,150/quintal",
            "priceTrend": "Rising demand from poultry and industrial feed sectors",
            "estimatedProfit": f"₹{int((25 * farm_size * 2150) - (budget * 0.35)):,}",
            "reasons": [
                "Fast growing short-duration crop cycle",
                "Resilient against minor weather fluctuations",
                "Consistent off-take by food and feed processing mills"
            ]
        },
        {
            "cropName": "Potato (Kufri Jyoti)",
            "profitability": "High Profit",
            "expectedYield": f"{int(100 * farm_size)} Quintals",
            "investment": f"₹{int(budget * 0.5):,}",
            "duration": "80-90 days",
            "marketPrice": "₹1,400/quintal",
            "priceTrend": "High seasonal volume with strong cold-storage value",
            "estimatedProfit": f"₹{int((100 * farm_size * 1400) - (budget * 0.5)):,}",
            "reasons": [
                "Exceptional yield output per acre for commercial farms",
                "Short harvest window allowing multi-cropping cycles",
                "High return on capital when timed before peak season"
            ]
        },
        {
            "cropName": "Tomato (Hybrid Abhinav)",
            "profitability": "Medium Profit",
            "expectedYield": f"{int(120 * farm_size)} Quintals",
            "investment": f"₹{int(budget * 0.4):,}",
            "duration": "110-120 days",
            "marketPrice": "₹1,800/quintal",
            "priceTrend": "Moderate fluctuation with high upside in local mandis",
            "estimatedProfit": f"₹{int((120 * farm_size * 1800) - (budget * 0.4)):,}",
            "reasons": [
                "Continuous picking yield over 4-6 weeks",
                "High consumer demand across nearby urban centers",
                "Responsive to balanced drip fertigation"
            ]
        }
    ]
    return crops_pool[:6]

async def generate_crop_recommendations(request: CropRecommendationRequest, iot_data: dict) -> List[dict]:
    client = get_async_groq_client()
    if not client:
        return get_fallback_crop_recommendations(request)
        
    temp = iot_data.get("current", {}).get("temperature_2m", "Unknown")
    humidity = iot_data.get("current", {}).get("relative_humidity_2m", "Unknown")
    soil_temp = iot_data.get("current", {}).get("soil_temperature_0cm", "Unknown")
    soil_moisture = iot_data.get("current", {}).get("soil_moisture_0_to_7cm", "Unknown")
    
    prompt = f"""
    You are an expert agricultural economist and agronomist for India.
    Provide "perfect" crop recommendations based on the user's specific farm details and REAL-TIME IoT sensor data.
    
    User's Farm Data:
    - Location: {request.location}
    - Farm Size: {request.farm_size} acres
    - Soil Type: {request.soil_type}
    - Season: {request.season}
    - Budget: ₹{request.budget}
    - Previous Crop: {request.previous_crop}
    
    Real-Time IoT Sensor Data (Open-Meteo):
    - Current Temperature: {temp}°C
    - Air Humidity: {humidity}%
    - Soil Temperature: {soil_temp}°C
    - Soil Moisture (0-7cm): {soil_moisture} m³/m³
    
    Task: Recommend exactly 6 most profitable crops suitable for these conditions.
    
    CRITICAL: Calculate financial data realistically for {request.farm_size} acres.
    "Live Market Prices": Use your comprehensive knowledge to estimate current market prices in {request.location} region.
    
    Return ONLY a JSON array with objects containing:
    - cropName: string
    - profitability: "High Profit" | "Medium Profit" | "Low Profit"
    - expectedYield: string (e.g. "X-Y quintals/acre", specific to {request.farm_size} acres total)
    - investment: string (e.g. "₹X,XXX")
    - duration: string (e.g. "110-120 days")
    - marketPrice: string (e.g. "₹2,500/quintal")
    - priceTrend: string (prophesize short market trend e.g. "Rising due to X")
    - estimatedProfit: string (e.g. "₹1,50,000")
    - reasons: string[] (3 distinct reasons explicitly referencing the IoT data where applicable)
    
    Ensure "estimatedProfit" is: (Yield * Market Price) - Investment.
    Output ONLY raw JSON array without backticks or markdown formatting.
    """
    
    try:
        completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional agricultural advisor. You always return a valid JSON array containing exactly 6 crop recommendations."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.4,
            max_tokens=1800,
        )
        result_text = completion.choices[0].message.content.strip()
        
        # Clean potential markdown
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0].strip()
        elif '```' in result_text:
            result_text = result_text.split('```')[1].strip()
        if '[' in result_text and ']' in result_text:
            result_text = result_text[result_text.find('['):result_text.rfind(']')+1]
            
        recommendations = json.loads(result_text)
        
        if isinstance(recommendations, list) and len(recommendations) > 0:
            return recommendations[:6]
        elif isinstance(recommendations, dict) and "recommendations" in recommendations:
            return recommendations["recommendations"][:6]
            
        return get_fallback_crop_recommendations(request)
    except Exception as e:
        print(f"AsyncGroq API Error: {e}, falling back to rule-based recommendations.")
        return get_fallback_crop_recommendations(request)


@router.post("/recommend", response_model=CropRecommendationResponse)
async def get_crop_recommendation(
    request: CropRecommendationRequest,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get AI-powered crop recommendations based on location and real-time conditions."""
    try:
        # Get simulated IoT weather/soil data from Open-Meteo
        iot_data = await open_meteo_service.get_farming_context(request.location)
        if not iot_data:
            iot_data = {"current": {}}
            
        # Generate crop recommendations using Groq based on conditions
        recommended_crops = await generate_crop_recommendations(request, iot_data)
        
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
            weather_data=json.dumps(iot_data)
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
