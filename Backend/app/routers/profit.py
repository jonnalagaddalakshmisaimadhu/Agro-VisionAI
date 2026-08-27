from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.services.soil_lookup import get_soil_by_district
from app.services.market_prices import MarketPricesService
from app.services.recommendation_engine import recommendation_engine
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


class ProfitRequest(BaseModel):
    crop_name: str
    area_ha: float = Field(..., gt=0)
    expected_yield_t_per_ha: Optional[float] = None  # tonnes per ha
    price_per_quintal: Optional[float] = None  # ₹ per quintal (100 kg)
    price_per_kg: Optional[float] = None
    input_costs: Optional[Dict[str, float]] = None  # breakdown: seeds, fertilizer, labor, machinery, irrigation
    district: Optional[str] = None
    place: Optional[str] = None
    market_location: Optional[str] = None
    irrigation_type: Optional[str] = None  # Drip, Canal, Rainfed, Sprinkler
    farming_type: Optional[str] = None  # Conventional, Organic, Natural


class ProfitResponse(BaseModel):
    crop_name: str
    category: Optional[str] = "General"
    area_ha: float
    revenue: float
    investment: float
    profit: float
    profit_per_ha: float
    profitability: str
    price_used: float
    price_per_kg: float
    yield_t_per_ha: float
    yield_total_kg: float
    break_even_price_per_kg: float
    break_even_price_per_quintal: float
    roi_percent: float
    bc_ratio: float
    cost_breakdown: Dict[str, float]
    scenarios: Dict[str, Any]
    notes: Optional[str] = None


@router.post("/predict", response_model=ProfitResponse)
async def predict_profit(request: ProfitRequest, db: Session = Depends(get_db)):
    """
    Intelligent profit and financial risk prediction for ANY crop, fruit, or vegetable.
    """
    try:
        crop_info = recommendation_engine._get_crop_info(request.crop_name)
        canonical_name = crop_info.get("name", request.crop_name.strip().title())
        category = crop_info.get("category", "General")

        # Determine price: prefer provided price, else try market prices service, else crop database fallback
        price_per_kg = None
        if request.price_per_kg and request.price_per_kg > 0:
            price_per_kg = request.price_per_kg
        elif request.price_per_quintal and request.price_per_quintal > 0:
            price_per_kg = request.price_per_quintal / 100.0
        else:
            service = MarketPricesService()
            location = request.market_location or request.district or request.place
            prices = service.get_market_prices(db, location=location, limit=10)
            for p in prices:
                if p.crop_name.lower() in canonical_name.lower() or canonical_name.lower() in p.crop_name.lower():
                    price_per_kg = p.current_price / 100.0 if p.current_price > 200 else p.current_price
                    break

        if price_per_kg is None:
            price_per_kg = float(crop_info.get("default_price_per_kg", 25.0))

        price_per_quintal = price_per_kg * 100.0

        # Determine yield
        if request.expected_yield_t_per_ha and request.expected_yield_t_per_ha > 0:
            yield_t_per_ha = request.expected_yield_t_per_ha
        else:
            yield_t_per_ha = float(crop_info.get("default_yield_t_per_ha", 5.0))

        # Adjust yield based on irrigation type
        if request.irrigation_type:
            it = request.irrigation_type.lower()
            if "drip" in it:
                yield_t_per_ha *= 1.15
            elif "rainfed" in it:
                yield_t_per_ha *= 0.85

        yield_total_kg = yield_t_per_ha * 1000.0 * request.area_ha

        # Revenue
        revenue = price_per_kg * yield_total_kg

        # Investment & Cost Breakdown
        default_invest_per_ha = float(crop_info.get("default_investment", 50000.0))
        cost_ratios = crop_info.get("cost_ratio", {"seeds": 0.2, "fertilizer": 0.25, "irrigation": 0.15, "labor": 0.25, "machinery": 0.15})

        if request.input_costs and len(request.input_costs) > 0:
            cost_breakdown = {k: round(float(v), 2) for k, v in request.input_costs.items()}
            total_investment = sum(cost_breakdown.values())
        else:
            total_investment = default_invest_per_ha * request.area_ha
            cost_breakdown = {
                "seeds": round(total_investment * cost_ratios.get("seeds", 0.2), 2),
                "fertilizer": round(total_investment * cost_ratios.get("fertilizer", 0.25), 2),
                "irrigation": round(total_investment * cost_ratios.get("irrigation", 0.15), 2),
                "labor": round(total_investment * cost_ratios.get("labor", 0.25), 2),
                "machinery": round(total_investment * cost_ratios.get("machinery", 0.15), 2),
            }

        cost_breakdown["total"] = round(total_investment, 2)

        # Financial Metrics
        profit = revenue - total_investment
        profit_per_ha = profit / request.area_ha if request.area_ha > 0 else 0.0

        break_even_per_kg = (total_investment / yield_total_kg) if yield_total_kg > 0 else 0.0
        break_even_per_quintal = break_even_per_kg * 100.0

        roi_percent = ((profit / total_investment) * 100.0) if total_investment > 0 else 0.0
        bc_ratio = (revenue / total_investment) if total_investment > 0 else 0.0

        # 3-Scenario Risk Engine
        scenarios = {
            "best_case": {
                "yield_t_per_ha": round(yield_t_per_ha * 1.15, 2),
                "price_per_kg": round(price_per_kg * 1.15, 2),
                "revenue": round(revenue * 1.32, 2),
                "profit": round((revenue * 1.32) - total_investment, 2),
                "roi_percent": round((((revenue * 1.32) - total_investment) / total_investment) * 100.0, 1)
            },
            "realistic": {
                "yield_t_per_ha": round(yield_t_per_ha, 2),
                "price_per_kg": round(price_per_kg, 2),
                "revenue": round(revenue, 2),
                "profit": round(profit, 2),
                "roi_percent": round(roi_percent, 1)
            },
            "worst_case": {
                "yield_t_per_ha": round(yield_t_per_ha * 0.85, 2),
                "price_per_kg": round(price_per_kg * 0.85, 2),
                "revenue": round(revenue * 0.72, 2),
                "profit": round((revenue * 0.72) - total_investment, 2),
                "roi_percent": round((((revenue * 0.72) - total_investment) / total_investment) * 100.0, 1)
            }
        }

        # Profitability Tier
        if profit_per_ha >= 100000:
            prof = "High Profit"
        elif profit_per_ha >= 30000:
            prof = "Medium Profit"
        else:
            prof = "Low Profit"

        notes_list = []
        if request.district:
            soil = get_soil_by_district(request.district)
            if soil:
                notes_list.append(f"District soil: {soil}")
        if request.irrigation_type:
            notes_list.append(f"Irrigation: {request.irrigation_type}")
        if request.farming_type:
            notes_list.append(f"Method: {request.farming_type}")

        notes = "; ".join(notes_list) if notes_list else None

        return ProfitResponse(
            crop_name=canonical_name,
            category=category,
            area_ha=request.area_ha,
            revenue=round(revenue, 2),
            investment=round(total_investment, 2),
            profit=round(profit, 2),
            profit_per_ha=round(profit_per_ha, 2),
            profitability=prof,
            price_used=round(price_per_quintal, 2),
            price_per_kg=round(price_per_kg, 2),
            yield_t_per_ha=round(yield_t_per_ha, 2),
            yield_total_kg=round(yield_total_kg, 2),
            break_even_price_per_kg=round(break_even_per_kg, 2),
            break_even_price_per_quintal=round(break_even_per_quintal, 2),
            roi_percent=round(roi_percent, 1),
            bc_ratio=round(bc_ratio, 2),
            cost_breakdown=cost_breakdown,
            scenarios=scenarios,
            notes=notes
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
