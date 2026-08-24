from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from pathlib import Path
import numpy as np
import pickle
import pandas as pd
import math

router = APIRouter()

MODEL_PATH = Path(__file__).resolve().parents[2] / "data" / "all_india_csv" / "soil_knn_model.pkl"
CSV_PATH = Path(__file__).resolve().parents[2] / "data" / "all_india_csv" / "india_district_soil_with_npk.csv"
_model = None
_district_rows = None

def load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            return None
        try:
            with open(MODEL_PATH, "rb") as f:
                _model = pickle.load(f)
        except Exception as e:
            import logging
            logging.error(f"Error loading soil KNN model: {e}")
            return None
    return _model

def load_district_csv():
    global _district_rows
    if _district_rows is not None:
        return _district_rows
    if not CSV_PATH.exists():
        _district_rows = []
        return _district_rows
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
    _district_rows = rows
    return _district_rows

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))

class SoilPredictRequest(BaseModel):
    lat: float
    lon: float

@router.post("/predict-soil")
async def predict_soil(req: SoilPredictRequest):
    # Try ML model first
    model = load_model()
    if model is not None:
        try:
            coords = np.radians([[req.lat, req.lon]])
            pred = model.predict(coords)
            soil_type = pred[0] if isinstance(pred, (list, np.ndarray)) else pred
            return {"soil_type": str(soil_type)}
        except Exception as e:
            pass  # fallback to CSV
    # Fallback to district CSV
    rows = load_district_csv()
    best = None
    best_d = None
    for row in rows:
        d = haversine(req.lat, req.lon, row['lat'], row['lon'])
        if best is None or d < best_d:
            best = row
            best_d = d
    if best:
        return {"soil_type": best['dominant_soil']}
    raise HTTPException(status_code=500, detail="No soil type found from model or CSV.")