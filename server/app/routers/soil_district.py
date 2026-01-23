from fastapi import APIRouter, Query, HTTPException
from pathlib import Path
import pandas as pd
import math

router = APIRouter()

CSV_PATH = Path(__file__).resolve().parents[3] / "ALL INDIA CSV" / "india_district_soil_with_npk.csv"
district_rows = []

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def load_district_csv():
    global district_rows
    if not CSV_PATH.exists():
        district_rows = []
        return
    df = pd.read_csv(CSV_PATH, dtype=str)
    # New dataset uses latitude/longitude columns
    df['lat'] = pd.to_numeric(df['latitude'], errors='coerce')
    df['lon'] = pd.to_numeric(df['longitude'], errors='coerce')
    rows = []
    for _, r in df.iterrows():
        if pd.isna(r['lat']) or pd.isna(r['lon']):
            continue
        rows.append({
            'state_code': r.get('state_code',''),
            'state_name': r.get('state','') or r.get('state_name',''),
            'district': r.get('district',''),
            'lat': float(r['lat']),
            'lon': float(r['lon']),
            'dominant_soil': (r.get('soil_type','') or r.get('dominant_soil','')).lower(),
            'secondary_soil': r.get('secondary_soil','').lower() if 'secondary_soil' in r else '',
            'confidence': r.get('confidence',''),
            'source': r.get('source',''),
            'date_of_survey': r.get('date_of_survey',''),
            'notes': r.get('notes',''),
        })
    district_rows = rows

load_district_csv()

@router.get("/soil")
def get_soil_type(lat: float = Query(...), lon: float = Query(...)):
    if not district_rows:
        raise HTTPException(status_code=500, detail="District soil dataset not loaded.")
    # Find nearest district
    best = None
    best_d = None
    for row in district_rows:
        try:
            d = haversine(lat, lon, row['lat'], row['lon'])
        except Exception:
            continue
        if best is None or d < best_d:
            best = row
            best_d = d
    if best is None:
        raise HTTPException(status_code=404, detail="No district found.")
    return {
        "soil_type": best['dominant_soil'],
        "district": best['district'],
        "state": best['state_name'],
        "distance_m": int(best_d),
        "confidence": best['confidence'],
        "source": best['source'],
        "secondary_soil": best['secondary_soil'],
        "notes": best['notes']
    }