import httpx
import csv
import io
import json
from pathlib import Path
from typing import Dict, Any, Optional
from app.core.config import settings

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"
DATA_DIR.mkdir(parents=True, exist_ok=True)


class AgmarknetService:
    def __init__(self):
        # Resource id can be provided via env or settings
        self.resource_id = getattr(settings, "AGMARKNET_RESOURCE_ID", None)
        self.api_key = getattr(settings, "AGRIMART_API_KEY", None)
        self.base_url = "https://api.data.gov.in/resource"

    async def fetch_resource(self, limit: int = 100) -> Dict[str, Any]:
        if not self.resource_id:
            raise Exception("AGMARKNET_RESOURCE_ID not configured in settings")

        params = {
            "resource_id": self.resource_id,
            "limit": limit
        }
        if self.api_key:
            params["api-key"] = self.api_key

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(self.base_url, params=params)
            resp.raise_for_status()
            data = resp.json()

        # Save raw JSON locally
        sample_path = DATA_DIR / f"agmarknet_{self.resource_id}.json"
        with open(sample_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return data

    async def fetch_csv(self, csv_url: str) -> Optional[str]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(csv_url)
            resp.raise_for_status()
            return resp.text

    def parse_csv_to_rows(self, csv_text: str):
        reader = csv.DictReader(io.StringIO(csv_text))
        for row in reader:
            yield row


agmarknet_service = AgmarknetService()
