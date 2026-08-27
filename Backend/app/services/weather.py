import httpx
import json
import logging
from typing import Dict, Optional, Any, List
from app.core.config import settings
import asyncio

logger = logging.getLogger(__name__)

# Upstash / Local Redis connection
try:
    import redis
    redis_url = getattr(settings, "REDIS_URL", None) or "rediss://default:gQAAAAAAAdYwAAIgcDEyOTQ4MDBlOTM3Nzk0ZTA5YjA3MmZmZDNkMDcyMTYyOA@clever-bee-120368.upstash.io:6379"
    redis_client = redis.from_url(redis_url, decode_responses=True, socket_timeout=3.0)
    redis_client.ping()
    logger.info("WeatherService connected to Redis cache successfully.")
except Exception as e:
    redis_client = None
    logger.warning(f"Redis cache not available for weather: {e}")


class WeatherService:
    def __init__(self):
        self.openweather_api_key = getattr(settings, "OPENWEATHER_API_KEY", "") or "5b88263f64d6c71a355d39ea646359c6"
        self.openweather_base = "https://api.openweathermap.org/data/2.5"
        self.openweather_geo = "https://api.openweathermap.org/geo/1.0"
        self.openmeteo_forecast = "https://api.open-meteo.com/v1/forecast"
        self.openmeteo_geo = "https://geocoding-api.open-meteo.com/v1/search"

    def _get_cache(self, key: str) -> Optional[Dict]:
        if not redis_client:
            return None
        try:
            val = redis_client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.debug(f"Redis cache read error: {e}")
        return None

    def _set_cache(self, key: str, data: Dict, ttl: int = 1800):
        if not redis_client:
            return
        try:
            redis_client.setex(key, ttl, json.dumps(data))
        except Exception as e:
            logger.debug(f"Redis cache write error: {e}")

    async def get_coordinates_by_city(self, city: str) -> Dict[str, float]:
        """Resolve city/district name to lat/lon using Open-Meteo or OpenWeather."""
        cache_key = f"geo:{city.strip().lower()}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        # 1. Try Open-Meteo Geocoding (free, no key)
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(self.openmeteo_geo, params={"name": city, "count": 1, "format": "json"})
                if res.status_code == 200:
                    data = res.json()
                    if "results" in data and len(data["results"]) > 0:
                        loc = data["results"][0]
                        coords = {
                            "lat": float(loc["latitude"]),
                            "lon": float(loc["longitude"]),
                            "name": loc.get("name", city),
                            "country": loc.get("country", "India")
                        }
                        self._set_cache(cache_key, coords, ttl=86400)
                        return coords
        except Exception as e:
            logger.debug(f"Open-Meteo geocoding error: {e}")

        # 2. Fallback to OpenWeather Geocoding
        if self.openweather_api_key:
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    res = await client.get(f"{self.openweather_geo}/direct", params={"q": city, "limit": 1, "appid": self.openweather_api_key})
                    if res.status_code == 200:
                        data = res.json()
                        if data:
                            coords = {
                                "lat": float(data[0]["lat"]),
                                "lon": float(data[0]["lon"]),
                                "name": data[0].get("name", city),
                                "country": data[0].get("country", "IN")
                            }
                            self._set_cache(cache_key, coords, ttl=86400)
                            return coords
            except Exception as e:
                logger.debug(f"OpenWeather geocoding error: {e}")

        # Default fallback to Delhi
        return {"lat": 28.6139, "lon": 77.2090, "name": city, "country": "IN"}

    async def get_weather_by_coordinates(self, lat: float, lon: float) -> Dict:
        """Fetch current weather with dual-provider fallback and Redis caching."""
        cache_key = f"weather:curr:{round(lat, 3)}:{round(lon, 3)}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        # 1. Try Open-Meteo
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    self.openmeteo_forecast,
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,surface_pressure,soil_temperature_0cm,soil_moisture_0_to_7cm",
                        "daily": "temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max",
                        "timezone": "auto"
                    }
                )
                if res.status_code == 200:
                    d = res.json()
                    curr = d.get("current", {})
                    daily = d.get("daily", {})
                    
                    weather_code = curr.get("weather_code", 0)
                    weather_desc = "Clear sky" if weather_code <= 1 else "Partly Cloudy" if weather_code <= 3 else "Rain" if weather_code in [51, 53, 55, 61, 63, 65, 80, 81, 82] else "Thunderstorm" if weather_code >= 95 else "Cloudy"

                    formatted = {
                        "coord": {"lat": lat, "lon": lon},
                        "weather": [{"id": weather_code, "main": weather_desc, "description": weather_desc.lower(), "icon": "01d"}],
                        "main": {
                            "temp": curr.get("temperature_2m", 25.0),
                            "feels_like": curr.get("apparent_temperature", curr.get("temperature_2m", 25.0)),
                            "temp_min": daily.get("temperature_2m_min", [20.0])[0] if daily.get("temperature_2m_min") else 20.0,
                            "temp_max": daily.get("temperature_2m_max", [30.0])[0] if daily.get("temperature_2m_max") else 30.0,
                            "pressure": curr.get("surface_pressure", 1013),
                            "humidity": curr.get("relative_humidity_2m", 50)
                        },
                        "wind": {"speed": curr.get("wind_speed_10m", 5.0)},
                        "soil": {
                            "soil_temperature_0cm": curr.get("soil_temperature_0cm", 22.0),
                            "soil_moisture_0_to_7cm": curr.get("soil_moisture_0_to_7cm", 0.25)
                        },
                        "uv_index": daily.get("uv_index_max", [5.0])[0] if daily.get("uv_index_max") else 5.0,
                        "provider": "Open-Meteo FOSS"
                    }
                    self._set_cache(cache_key, formatted, ttl=1800)
                    return formatted
        except Exception as e:
            logger.debug(f"Open-Meteo current weather error: {e}")

        # 2. Fallback to OpenWeather
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"{self.openweather_base}/weather",
                    params={"lat": lat, "lon": lon, "appid": self.openweather_api_key, "units": "metric"}
                )
                if res.status_code == 200:
                    data = res.json()
                    data["provider"] = "OpenWeather"
                    self._set_cache(cache_key, data, ttl=1800)
                    return data
        except Exception as e:
            logger.debug(f"OpenWeather error: {e}")

        # Static resilient fallback
        return {
            "coord": {"lat": lat, "lon": lon},
            "weather": [{"main": "Partly Cloudy", "description": "partly cloudy"}],
            "main": {"temp": 28.0, "humidity": 60, "feels_like": 29.0},
            "wind": {"speed": 8.0},
            "provider": "Fallback"
        }

    async def get_weather_by_city(self, city: str) -> Dict:
        """Fetch weather by city name with automatic geocoding."""
        coords = await self.get_coordinates_by_city(city)
        return await self.get_weather_by_coordinates(coords["lat"], coords["lon"])

    async def get_forecast_by_coordinates(self, lat: float, lon: float) -> Dict:
        """Fetch 7-day agro-meteorological forecast with soil moisture and UV index."""
        cache_key = f"weather:forecast:{round(lat, 3)}:{round(lon, 3)}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.get(
                    self.openmeteo_forecast,
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,rain_sum,uv_index_max,weather_code,et0_fao_evapotranspiration",
                        "hourly": "temperature_2m,relative_humidity_2m,soil_temperature_0cm,soil_moisture_0_to_7cm",
                        "timezone": "auto"
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    self._set_cache(cache_key, data, ttl=3600)
                    return data
        except Exception as e:
            logger.debug(f"Open-Meteo forecast error: {e}")

        # Fallback to OpenWeather forecast
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"{self.openweather_base}/forecast",
                    params={"lat": lat, "lon": lon, "appid": self.openweather_api_key, "units": "metric"}
                )
                if res.status_code == 200:
                    data = res.json()
                    self._set_cache(cache_key, data, ttl=3600)
                    return data
        except Exception as e:
            logger.debug(f"OpenWeather forecast fallback error: {e}")

        return {}

    def get_farming_recommendations(self, weather_data: Dict) -> Dict:
        """Actionable agronomic advisories generated from live climate conditions."""
        main_data = weather_data.get("main", {})
        temp = main_data.get("temp", 26.0)
        humidity = main_data.get("humidity", 50.0)
        wind_speed = weather_data.get("wind", {}).get("speed", 5.0)
        weather_main = weather_data.get("weather", [{}])[0].get("main", "").lower()
        soil_moisture = weather_data.get("soil", {}).get("soil_moisture_0_to_7cm", 0.25)

        # 1. Irrigation Advisory
        if humidity > 80 or "rain" in weather_main or soil_moisture > 0.35:
            irrigation_status = "hold"
            irrigation_advisory = "Soil moisture high or rainfall expected. Postpone irrigation to avoid waterlogging."
        elif humidity < 35 or temp > 36 or soil_moisture < 0.18:
            irrigation_status = "urgent"
            irrigation_advisory = "High evaporation rate and dry soil. Schedule evening drip or furrow irrigation."
        else:
            irrigation_status = "normal"
            irrigation_advisory = "Soil moisture optimal. Standard irrigation cycle recommended."

        # 2. Spraying Advisory
        if wind_speed > 12:
            spraying_status = "avoid"
            spraying_advisory = f"High wind speed ({wind_speed} km/h) causes chemical spray drift. Avoid spraying."
        elif "rain" in weather_main:
            spraying_status = "avoid"
            spraying_advisory = "Precipitation will wash away pesticide sprays. Delay chemical applications."
        else:
            spraying_status = "optimal"
            spraying_advisory = "Calm winds and clear skies. Ideal window for nutrient and pest foliar spray (early morning)."

        # 3. Sowing & Planting Advisory
        if 18 <= temp <= 32 and 40 <= humidity <= 75:
            planting_status = "excellent"
            planting_advisory = f"Favorable temperature ({temp}°C) and humidity for seed germination and transplanting."
        elif temp > 38:
            planting_status = "poor"
            planting_advisory = "Excessive heat stress. Delay nursery transplanting to prevent seedling scorch."
        else:
            planting_status = "moderate"
            planting_advisory = "Moderate conditions for planting. Ensure adequate basal fertilization and moisture."

        # 4. Harvesting & Post-Harvest Advisory
        if "rain" in weather_main:
            harvest_status = "warning"
            harvest_advisory = "Rain threat detected. Ensure harvested crops are moved to covered shelter immediately."
        else:
            harvest_status = "favorable"
            harvest_advisory = "Dry weather favorable for crop harvesting, threshing, and open sun drying."

        # 5. Severe Weather Alerts
        alerts = []
        if temp >= 40:
            alerts.append({"type": "critical", "title": "Severe Heatwave Alert", "message": f"Extreme temperature ({temp}°C). Protect seedlings and increase irrigation frequency."})
        elif temp <= 5:
            alerts.append({"type": "critical", "title": "Frost Alert", "message": f"Low temperature ({temp}°C). Risk of ground frost. Apply light irrigation."})
        if wind_speed >= 35:
            alerts.append({"type": "warning", "title": "Gale / High Wind Alert", "message": f"Strong winds ({wind_speed} km/h). Stake tall crops (banana, papaya, sugarcane)."})
        if "storm" in weather_main or "thunderstorm" in weather_main:
            alerts.append({"type": "critical", "title": "Thunderstorm Warning", "message": "Severe thunderstorm and lightning forecast. Keep livestock in shelter."})

        return {
            "irrigation": {"status": irrigation_status, "advisory": irrigation_advisory},
            "spraying": {"status": spraying_status, "advisory": spraying_advisory},
            "planting": {"status": planting_status, "advisory": planting_advisory},
            "harvesting": {"status": harvest_status, "advisory": harvest_advisory},
            "alerts": alerts
        }

    async def generate_agricultural_report(self, location_query: str) -> Dict[str, Any]:
        """Aggregate Current Weather, Forecast, Soil, and Actionable Farm Advisories into a full report."""
        coords = await self.get_coordinates_by_city(location_query)
        lat, lon = coords["lat"], coords["lon"]

        weather_task = self.get_weather_by_coordinates(lat, lon)
        forecast_task = self.get_forecast_by_coordinates(lat, lon)

        weather_data, forecast_data = await asyncio.gather(weather_task, forecast_task)
        recommendations = self.get_farming_recommendations(weather_data)

        report = {
            "report_id": f"AGRI_RPT_{int(asyncio.get_event_loop().time() * 1000)}",
            "generated_at": "Live Real-Time Sync",
            "location": {
                "query": location_query,
                "resolved_name": coords.get("name", location_query),
                "latitude": lat,
                "longitude": lon,
                "country": coords.get("country", "India")
            },
            "current_climate": {
                "temperature": weather_data.get("main", {}).get("temp"),
                "feels_like": weather_data.get("main", {}).get("feels_like"),
                "humidity_percent": weather_data.get("main", {}).get("humidity"),
                "wind_speed_kmh": weather_data.get("wind", {}).get("speed"),
                "condition": weather_data.get("weather", [{}])[0].get("main"),
                "uv_index": weather_data.get("uv_index", 5.0),
                "soil_moisture": weather_data.get("soil", {}).get("soil_moisture_0_to_7cm", 0.25),
                "soil_temperature": weather_data.get("soil", {}).get("soil_temperature_0cm", 22.0)
            },
            "advisories": recommendations,
            "forecast_summary": {
                "next_7_days": forecast_data.get("daily", {})
            },
            "printable_summary": (
                f"Agricultural Weather Advisory for {coords.get('name', location_query)}:\n"
                f"• Temp: {weather_data.get('main', {}).get('temp')}°C, Humidity: {weather_data.get('main', {}).get('humidity')}%\n"
                f"• Irrigation: {recommendations['irrigation']['advisory']}\n"
                f"• Spraying: {recommendations['spraying']['advisory']}\n"
                f"• Sowing: {recommendations['planting']['advisory']}\n"
            )
        }
        return report


# Global instance
weather_service = WeatherService()
from app.services.open_meteo import open_meteo_service

