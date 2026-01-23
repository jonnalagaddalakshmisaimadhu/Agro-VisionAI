from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict
from app.services.soil_lookup import get_soil_by_district
from app.services.market_prices import MarketPricesService
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


class ProfitRequest(BaseModel):
    crop_name: str
    area_ha: float = Field(..., gt=0)
    expected_yield_t_per_ha: Optional[float] = None  # tonnes per ha
    price_per_quintal: Optional[float] = None  # ₹ per quintal (100 kg)
    input_costs: Optional[Dict[str, float]] = None  # breakdown: seed, fertilizer, labor, etc.
    district: Optional[str] = None
    place: Optional[str] = None
    market_location: Optional[str] = None


class ProfitResponse(BaseModel):
    crop_name: str
    area_ha: float
    revenue: float
    investment: float
    profit: float
    profit_per_ha: float
    profitability: str
    price_used: float
    notes: Optional[str] = None


@router.post("/predict", response_model=ProfitResponse)
async def predict_profit(request: ProfitRequest, db: Session = Depends(get_db)):
    """Simple rule-based profit estimator. Later replaced by ML model."""
    try:
        # Determine price: prefer provided price, else try market prices service
        price_used = None
        if request.price_per_quintal:
            price_used = request.price_per_quintal
        else:
            service = MarketPricesService()
            # try to fetch recent price for crop and market location
            prices = service.get_market_prices(db, location=request.market_location, limit=10)
            for p in prices:
                if p.crop_name.lower() == request.crop_name.lower():
                    price_used = p.current_price * 100  # stored in ₹/kg or fallback; convert to per quintal assumption
                    break

        # Fallback price (if still None)
        if price_used is None:
            # very conservative fallback
            price_used = 2000.0  # ₹ per quintal

        # Determine yield (kg)
        if request.expected_yield_t_per_ha:
            yield_total_kg = request.expected_yield_t_per_ha * 1000.0 * request.area_ha
        else:
            # fallback default yield per ha (in tonnes)
            default_t_per_ha = 2.5
            yield_total_kg = default_t_per_ha * 1000.0 * request.area_ha

        # Revenue: price_per_quintal is ₹ per 100 kg
        revenue = (price_used / 100.0) * yield_total_kg

        # Investment: sum of input_costs if provided, else estimate per ha
        if request.input_costs:
            investment = sum([float(v) for v in request.input_costs.values()])
        else:
            # simple per-ha estimate (₹)
            per_ha_estimate = 30000.0
            investment = per_ha_estimate * request.area_ha

        profit = revenue - investment
        profit_per_ha = profit / request.area_ha

        # Profitability category
        if profit_per_ha >= 50000:
            prof = "High Profit"
        elif profit_per_ha >= 10000:
            prof = "Medium Profit"
        else:
            prof = "Low Profit"

        notes_list = []
        # If soil provided via district, note soil lookup
        if request.district and not request.place:
            soil = get_soil_by_district(request.district)
            if soil:
                notes_list.append(f"Soil detected: {soil}")

        notes = "; ".join(notes_list) if notes_list else None

        return ProfitResponse(
            crop_name=request.crop_name,
            area_ha=request.area_ha,
            revenue=round(revenue, 2),
            investment=round(investment, 2),
            profit=round(profit, 2),
            profit_per_ha=round(profit_per_ha, 2),
            profitability=prof,
            price_used=round(price_used, 2),
            notes=notes
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
