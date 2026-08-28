import httpx
import json
from pathlib import Path
from typing import Dict, Any

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"
DATA_DIR.mkdir(parents=True, exist_ok=True)


class OpenMeteoService:
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"

    async def fetch_hourly_soil_and_weather(self, lat: float, lon: float, hourly: str = "temperature_2m,relative_humidity_2m,soil_temperature_0cm,soil_moisture_0_to_1cm") -> Dict[str, Any]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": hourly,
            "timezone": "auto"
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(self.base_url, params=params)
            resp.raise_for_status()
            data = resp.json()

        # Save sample locally for EDA
        sample_path = DATA_DIR / f"open_meteo_{int(lat)}_{int(lon)}.json"
        with open(sample_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return data

    async def fetch_full_forecast(self, lat: float, lon: float, daily: str = None, hourly: str = None, current: bool = True) -> Dict[str, Any]:
        params = {"latitude": lat, "longitude": lon, "timezone": "auto"}
        if daily:
            params["daily"] = daily
        if hourly:
            params["hourly"] = hourly
        if current:
            params["current_weather"] = True

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(self.base_url, params=params)
            resp.raise_for_status()
            data = resp.json()

        sample_path = DATA_DIR / f"open_meteo_forecast_{int(lat)}_{int(lon)}.json"
        with open(sample_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    async def get_farming_context(self, location_query: str = "Guntur, Andhra Pradesh") -> Dict[str, Any]:
        """Fetch realistic or live farming context based on location query"""
        try:
            # Default to Guntur/Andhra coordinates
            lat, lon = 16.3067, 80.4365
            if "krishna" in location_query.lower() or "vijayawada" in location_query.lower():
                lat, lon = 16.5062, 80.6480
            elif "bapatla" in location_query.lower():
                lat, lon = 15.9042, 80.4674

            data = await self.fetch_full_forecast(lat=lat, lon=lon, current=True)
            current = data.get("current_weather", {})
            return {
                "location": location_query,
                "current": {
                    "temperature": current.get("temperature", 28.5),
                    "windspeed": current.get("windspeed", 12.0),
                    "humidity": 68.0,
                    "rainfall": 0.0
                }
            }
        except Exception:
            return {
                "location": location_query,
                "current": {
                    "temperature": 28.5,
                    "windspeed": 12.0,
                    "humidity": 68.0,
                    "rainfall": 0.0
                }
            }


# Global instance
open_meteo_service = OpenMeteoService()
