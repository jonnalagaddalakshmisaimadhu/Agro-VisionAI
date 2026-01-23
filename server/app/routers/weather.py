from fastapi import APIRouter, HTTPException, status
from app.services.weather import weather_service
from typing import Dict

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
