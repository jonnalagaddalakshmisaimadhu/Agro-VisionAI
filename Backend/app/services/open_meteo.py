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

        return data


# Global instance
open_meteo_service = OpenMeteoService()
