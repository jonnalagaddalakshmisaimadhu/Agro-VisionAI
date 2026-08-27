from fastapi import APIRouter, HTTPException, status
from app.services.weather import weather_service
from typing import Dict, Optional, List, Any


router = APIRouter()

@router.get("/current/{city}")
async def get_current_weather(city: str) -> Dict:
    """Get current weather for a city."""
    try:
        weather_data = await weather_service.get_weather_by_city(city)
        farming_recommendations = weather_service.get_farming_recommendations(weather_data)
        
        return {
            "weather": weather_data,
            "farming_recommendations": farming_recommendations
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/current/coordinates/{lat}/{lon}")
async def get_current_weather_by_coordinates(lat: float, lon: float) -> Dict:
    """Get current weather by coordinates."""
    try:
        weather_data = await weather_service.get_weather_by_coordinates(lat, lon)
        farming_recommendations = weather_service.get_farming_recommendations(weather_data)
        
        return {
            "weather": weather_data,
            "farming_recommendations": farming_recommendations
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/forecast/{city}")
async def get_weather_forecast(city: str) -> Dict:
    """Get 5-day weather forecast for a city."""
    try:
        # Get coordinates first
        coords = await weather_service.get_coordinates_by_city(city)
        lat, lon = coords["lat"], coords["lon"]
        
        # Get forecast
        forecast_data = await weather_service.get_forecast_by_coordinates(lat, lon)
        
        return {
            "city": city,
            "coordinates": {"lat": lat, "lon": lon},
            "forecast": forecast_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/forecast/coordinates/{lat}/{lon}")
async def get_weather_forecast_by_coordinates(lat: float, lon: float) -> Dict:
    """Get 5-day weather forecast by coordinates."""
    try:
        forecast_data = await weather_service.get_forecast_by_coordinates(lat, lon)
        
        return {
            "coordinates": {"lat": lat, "lon": lon},
            "forecast": forecast_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/coordinates/{city}")
async def get_city_coordinates(city: str) -> Dict:
    """Get coordinates for a city."""
    try:
        coords = await weather_service.get_coordinates_by_city(city)
        return coords
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/report/{city}")
async def get_agricultural_weather_report(city: str) -> Dict:
    """Get comprehensive printable agricultural weather and advisory report."""
    try:
        report = await weather_service.generate_agricultural_report(city)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

from pydantic import BaseModel, EmailStr
from app.services.notification_service import notification_service

class EmailAlertRequest(BaseModel):
    email: EmailStr
    city: str
    subject: Optional[str] = "🌾 FarmIQ Real-Time Agro-Weather Alert"

@router.post("/alerts/send-email")
async def send_weather_email_alert(request: EmailAlertRequest) -> Dict:
    """Dispatches a structured HTML weather advisory email to the farmer."""
    try:
        report = await weather_service.generate_agricultural_report(request.city)
        curr = report.get("current_climate", {})
        adv = report.get("advisories", {})
        
        alert_payload = {
            "location": request.city,
            "title": f"Climate Update: {curr.get('temperature', 28)}°C, {curr.get('condition', 'Clear')}",
            "message": f"Humidity {curr.get('humidity_percent', 50)}%, Wind {curr.get('wind_speed_kmh', 10)} km/h",
            "irrigation": adv.get("irrigation", {}).get("advisory", "Standard cycle."),
            "spraying": adv.get("spraying", {}).get("advisory", "Favorable."),
            "planting": adv.get("planting", {}).get("advisory", "Moderate.")
        }
        
        result = notification_service.send_email_alert(
            to_email=request.email,
            subject=request.subject,
            alert_data=alert_payload
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/alerts/voice-script/{city}")
async def get_voice_advisory_script(city: str, lang: str = "en") -> Dict:
    """Generates natural vernacular voice audio scripts for TTS & mobile voice playback."""
    try:
        report = await weather_service.generate_agricultural_report(city)
        script = notification_service.format_voice_script(city, report, lang=lang)
        return {
            "city": city,
            "language": lang,
            "voice_script": script,
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


