import httpx
from typing import Dict, Optional
from app.core.config import settings

class WeatherService:
    def __init__(self):
        self.openweather_api_key = settings.OPENWEATHER_API_KEY
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.geo_url = "https://api.openweathermap.org/geo/1.0"
    
    async def get_weather_by_coordinates(self, lat: float, lon: float) -> Dict:
        """Get current weather by coordinates."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/weather",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.openweather_api_key,
                        "units": "metric"
                    }
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"Error fetching weather data: {e}")
    
    async def get_weather_by_city(self, city: str) -> Dict:
        """Get current weather by city name."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/weather",
                    params={
                        "q": city,
                        "appid": self.openweather_api_key,
                        "units": "metric"
                    }
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"Error fetching weather data for city {city}: {e}")
    
    async def get_forecast_by_coordinates(self, lat: float, lon: float) -> Dict:
        """Get 5-day weather forecast by coordinates."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/forecast",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.openweather_api_key,
                        "units": "metric"
                    }
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"Error fetching forecast data: {e}")
    
    async def get_coordinates_by_city(self, city: str) -> Dict:
        """Get coordinates by city name."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.geo_url}/direct",
                    params={
                        "q": city,
                        "limit": 1,
                        "appid": self.openweather_api_key
                    }
                )
                response.raise_for_status()
                data = response.json()
                if data:
                    return data[0]
                else:
                    raise Exception(f"City {city} not found")
        except httpx.HTTPError as e:
            raise Exception(f"Error fetching coordinates for city {city}: {e}")
    
    def get_farming_recommendations(self, weather_data: Dict) -> Dict:
        """Get farming recommendations based on weather data."""
        temp = weather_data.get("main", {}).get("temp", 0)
        humidity = weather_data.get("main", {}).get("humidity", 0)
        wind_speed = weather_data.get("wind", {}).get("speed", 0)
        weather_main = weather_data.get("weather", [{}])[0].get("main", "").lower()
        
        recommendations = {
            "planting": "moderate",
            "irrigation": "moderate",
            "field_work": "good",
            "spraying": "moderate"
        }
        
        # Planting recommendations
        if 15 <= temp <= 30 and humidity > 40:
            recommendations["planting"] = "excellent"
        elif temp < 10 or temp > 35:
            recommendations["planting"] = "poor"
        
        # Irrigation recommendations
        if humidity > 80:
            recommendations["irrigation"] = "reduce"
        elif humidity < 30:
            recommendations["irrigation"] = "increase"
        
        # Field work recommendations
        if weather_main in ["rain", "storm"] or wind_speed > 15:
            recommendations["field_work"] = "poor"
        elif weather_main == "clear" and wind_speed < 10:
            recommendations["field_work"] = "excellent"
        
        # Spraying recommendations
        if wind_speed > 10 or weather_main in ["rain", "storm"]:
            recommendations["spraying"] = "avoid"
        elif wind_speed < 5 and weather_main == "clear":
            recommendations["spraying"] = "excellent"
        
        return recommendations

# Global instance
weather_service = WeatherService()
