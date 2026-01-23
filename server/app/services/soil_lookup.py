import csv
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"
DATA_DIR.mkdir(parents=True, exist_ok=True)

SOIL_CSV = DATA_DIR / "soil_ap.csv"


def load_soil_mapping() -> dict:
    mapping = {}
    if not SOIL_CSV.exists():
        return mapping

    with open(SOIL_CSV, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Expecting columns: State, District, Mandal, Place, SoilType
            district = row.get('District') or row.get('district')
            soil = row.get('SoilType') or row.get('soil_type') or row.get('soil')
            place = row.get('Place') or row.get('place') or ''
            if not district or not soil:
                continue
            key = district.strip().lower()
            # store list of (place, soil)
            mapping.setdefault(key, []).append({"place": place.strip(), "soil": soil.strip()})
    return mapping


def get_soil_by_district(district: str) -> Optional[str]:
    mapping = load_soil_mapping()
    if not district:
        return None
    key = district.strip().lower()
    records = mapping.get(key)
    if not records:
        return None
    # return most common/first soil type
    return records[0]["soil"]


def get_soil_by_place(district: str, place: str) -> Optional[str]:
    mapping = load_soil_mapping()
    if not district:
        return None
    key = district.strip().lower()
    records = mapping.get(key)
    if not records:
        return None
    if place:
        p = place.strip().lower()
        for rec in records:
            if rec["place"].lower() == p:
                return rec["soil"]
    return records[0]["soil"]
