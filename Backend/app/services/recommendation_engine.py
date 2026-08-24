import asyncio
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from app.services.weather import weather_service
from app.services.open_meteo import open_meteo_service
from app.services.market_prices import MarketPricesService
from app.services.soil_lookup import get_soil_by_district
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class RecommendationEngine:
    def __init__(self):
        self.market_service = MarketPricesService()
        
        # Crop database with agronomic and default economic data
        self.crop_database = {
            "Tomato": {
                "default_yield_t_per_ha": 25,
                "soil_preference": ["Loam", "Sandy Loam"],
                "season": ["Kharif", "Rabi", "Summer"],
                "duration_days": (92, 112),
                "default_investment": 60000,
                "water_needs": "High",
                "pest_risk": "Medium"
            },
            "Potato": {
                "default_yield_t_per_ha": 20,
                "soil_preference": ["Loam", "Sandy Loam", "Clay Loam"],
                "season": ["Rabi", "Winter"],
                "duration_days": (105, 129),
                "default_investment": 50000,
                "water_needs": "Medium",
                "pest_risk": "High"
            },
            "Wheat": {
                "default_yield_t_per_ha": 5,
                "soil_preference": ["Loam", "Clay Loam", "Clay"],
                "season": ["Rabi"],
                "duration_days": (117, 143),
                "default_investment": 40000,
                "water_needs": "Medium",
                "pest_risk": "Low"
            },
            "Maize": {
                "default_yield_t_per_ha": 7,
                "soil_preference": ["Loam", "Sandy Loam", "Clay Loam"],
                "season": ["Kharif", "Summer"],
                "duration_days": (100, 120),
                "default_investment": 35000,
                "water_needs": "Medium",
                "pest_risk": "Medium"
            },
            "Cotton": {
                "default_yield_t_per_ha": 2.5,
                "soil_preference": ["Black Soil", "Clay Loam"],
                "season": ["Kharif"],
                "duration_days": (180, 200),
                "default_investment": 80000,
                "water_needs": "High",
                "pest_risk": "High"
            },
            "Onion": {
                "default_yield_t_per_ha": 30,
                "soil_preference": ["Loam", "Clay Loam"],
                "season": ["Rabi", "Kharif"],
                "duration_days": (94, 142),
                "default_investment": 60000,
                "water_needs": "Medium",
                "pest_risk": "Medium"
            },
            "Rice": {
                "default_yield_t_per_ha": 5,
                "soil_preference": ["Clay", "Clay Loam"],
                "season": ["Kharif"],
                "duration_days": (120, 150),
                "default_investment": 45000,
                "water_needs": "Very High",
                "pest_risk": "Medium"
            },
            "Sugarcane": {
                "default_yield_t_per_ha": 80,
                "soil_preference": ["Black Soil", "Loam"],
                "season": ["Kharif"],
                "duration_days": (360, 540),
                "default_investment": 90000,
                "water_needs": "Very High",
                "pest_risk": "Medium"
            },
            "Mustard": {
                "default_yield_t_per_ha": 2,
                "soil_preference": ["Loam", "Sandy Loam"],
                "season": ["Rabi"],
                "duration_days": (120, 140),
                "default_investment": 25000,
                "water_needs": "Low",
                "pest_risk": "Low"
            },
            "Bell Pepper": {
                "default_yield_t_per_ha": 22,
                "soil_preference": ["Loam", "Sandy Loam"],
                "season": ["All"],
                "duration_days": (100, 120),
                "default_investment": 70000,
                "water_needs": "High",
                "pest_risk": "High"
            }
        }

    async def get_recommendations(
        self,
        district: str,
        area_ha: float,
        season: str,
        db: Session,
        desired_crops: Optional[List[str]] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        budget: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Main orchestration function to generate crop recommendations.
        Fetches live market prices, weather, soil info, and calculates profit.
        """
        start_time = datetime.utcnow()
        request_id = f"rec_{int(start_time.timestamp())}"
        
        try:
            # Get candidate crops
            if desired_crops:
                candidates = [c for c in desired_crops if c in self.crop_database]
            else:
                candidates = list(self.crop_database.keys())
            
            # Parallel fetch: weather, soil, market prices
            weather_data, soil_info, market_prices = await asyncio.gather(
                self._fetch_weather_safe(lat, lon, district),
                self._fetch_soil_safe(district),
                self._fetch_market_prices_safe(candidates, district, db),
                return_exceptions=True
            )
            
            # Handle exceptions
            weather_data = weather_data if not isinstance(weather_data, Exception) else {}
            soil_info = soil_info if not isinstance(soil_info, Exception) else {}
            market_prices = market_prices if not isinstance(market_prices, Exception) else {}
            
            # Score and rank crops
            recommendations = []
            for crop in candidates:
                score_data = self._compute_crop_score(
                    crop,
                    district,
                    season,
                    area_ha,
                    weather_data,
                    soil_info,
                    market_prices,
                    budget
                )
                recommendations.append(score_data)
            
            # Sort by profitability and suitability
            recommendations.sort(key=lambda x: x["final_score"], reverse=True)
            
            # Take top 5
            top_recommendations = recommendations[:5]
            
            elapsed_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return {
                "request_id": request_id,
                "status": "success",
                "location": {"district": district, "lat": lat, "lon": lon},
                "area_ha": area_ha,
                "season": season,
                "recommendations": top_recommendations,
                "metadata": {
                    "elapsed_ms": elapsed_ms,
                    "recommendation_count": len(top_recommendations),
                    "total_evaluated": len(candidates),
                    "timestamp": start_time.isoformat()
                }
            }
        
        except Exception as e:
            logger.exception(f"Error in get_recommendations: {str(e)}")
            return {
                "request_id": request_id,
                "status": "error",
                "error": str(e),
                "recommendations": []
            }

    async def _fetch_weather_safe(self, lat: Optional[float], lon: Optional[float], district: str) -> Dict:
        """Safely fetch weather data with fallback."""
        try:
            if lat and lon:
                return await weather_service.get_forecast_by_coordinates(lat, lon)
            else:
                # Use district as city fallback
                return await weather_service.get_weather_by_city(district)
        except Exception as e:
            logger.warning(f"Weather fetch failed: {e}")
            return {}

    async def _fetch_soil_safe(self, district: str) -> Dict:
        """Safely fetch soil info with fallback."""
        try:
            soil_type = get_soil_by_district(district)
            return {"soil_type": soil_type if soil_type else "Unknown", "district": district}
        except Exception as e:
            logger.warning(f"Soil lookup failed: {e}")
            return {"soil_type": "Unknown", "district": district}

    async def _fetch_market_prices_safe(self, crops: List[str], district: str, db: Session) -> Dict:
        """Safely fetch live market prices from database/API."""
        try:
            prices = {}
            for crop in crops:
                # Try to fetch from market prices service
                market_price_records = self.market_service.get_market_prices(db, location=district, limit=1)
                crop_price = None
                
                # Look for matching crop in records
                for record in market_price_records:
                    if record.crop_name.lower() == crop.lower():
                        crop_price = record.current_price
                        break
                
                if not crop_price:
                    # Use fallback from market service fallback_prices
                    crop_price = self.market_service.fallback_prices.get(crop, {}).get("price", 2000)
                
                prices[crop] = {"price_per_kg": crop_price}
            
            return prices
        except Exception as e:
            logger.warning(f"Market prices fetch failed: {e}")
            return {crop: {"price_per_kg": 2000} for crop in crops}

    def _compute_crop_score(
        self,
        crop: str,
        district: str,
        season: str,
        area_ha: float,
        weather: Dict,
        soil: Dict,
        prices: Dict,
        budget: Optional[float]
    ) -> Dict[str, Any]:
        """Compute profitability and suitability score for a crop."""
        
        crop_info = self.crop_database.get(crop, {})
        
        # Default values
        yield_t_per_ha = crop_info.get("default_yield_t_per_ha", 5)
        investment = crop_info.get("default_investment", 50000)
        
        # Get live price
        price_per_kg = prices.get(crop, {}).get("price_per_kg", 2000)
        # Assume price in ₹/kg, convert to ₹/quintal (100 kg)
        price_per_quintal = price_per_kg * 100
        
        # Calculate revenue
        yield_kg = yield_t_per_ha * 1000 * area_ha
        revenue = (price_per_quintal / 100) * yield_kg
        
        # Calculate profit
        total_investment = investment * area_ha
        profit = revenue - total_investment
        profit_per_ha = profit / area_ha if area_ha > 0 else 0
        
        # Compute profitability category
        if profit_per_ha >= 100000:
            profitability = "High Profit"
        elif profit_per_ha >= 20000:
            profitability = "Medium Profit"
        else:
            profitability = "Low Profit"
        
        # Compute soil match score
        soil_score = self._compute_soil_match(crop, soil.get("soil_type"))
        
        # Compute season match score
        season_score = self._compute_season_match(crop, season)
        
        # Compute weather suitability
        weather_score = self._compute_weather_suitability(crop, weather)
        
        # Budget check
        budget_score = 1.0 if not budget or total_investment <= budget else 0.5
        
        # Combine scores (weighted)
        agronomy_score = (soil_score * 0.35 + season_score * 0.35 + weather_score * 0.3)
        profit_score = min(profit_per_ha / 100000, 1.0)  # Normalize to 0-1
        
        final_score = (agronomy_score * 0.4 + profit_score * 0.5 + budget_score * 0.1)
        
        # Generate explanation
        explanation = self._generate_explanation(
            crop, profit_per_ha, soil, season, price_per_kg, soil_score, season_score
        )
        
        return {
            "crop": crop,
            "profitability": profitability,
            "revenue": round(revenue, 2),
            "investment": round(total_investment, 2),
            "profit": round(profit, 2),
            "profit_per_ha": round(profit_per_ha, 2),
            "yield_t_per_ha": yield_t_per_ha,
            "duration_days": crop_info.get("duration_days", (0, 0)),
            "price_per_kg": round(price_per_kg, 2),
            "price_per_quintal": round(price_per_quintal, 2),
            "suitability_score": round(agronomy_score, 2),
            "profit_score": round(profit_score, 2),
            "soil_match": round(soil_score, 2),
            "season_match": round(season_score, 2),
            "final_score": round(final_score, 3),
            "explanation": explanation,
            "risk": crop_info.get("pest_risk", "Medium"),
            "water_requirement": crop_info.get("water_needs", "Medium")
        }

    def _compute_soil_match(self, crop: str, soil_type: Optional[str]) -> float:
        """Score soil suitability for crop (0-1)."""
        if not soil_type or soil_type == "Unknown":
            return 0.5
        
        crop_info = self.crop_database.get(crop, {})
        preferred_soils = crop_info.get("soil_preference", [])
        
        if soil_type in preferred_soils:
            return 1.0
        elif any(ps.lower() in soil_type.lower() for ps in preferred_soils):
            return 0.8
        else:
            return 0.5

    def _compute_season_match(self, crop: str, season: str) -> float:
        """Score season suitability for crop (0-1)."""
        crop_info = self.crop_database.get(crop, {})
        preferred_seasons = crop_info.get("season", [])
        
        if "All" in preferred_seasons or season in preferred_seasons:
            return 1.0
        else:
            return 0.4

    def _compute_weather_suitability(self, crop: str, weather: Dict) -> float:
        """Score weather suitability for crop (0-1)."""
        if not weather:
            return 0.7
        
        # Simple heuristic based on temperature
        temp = weather.get("main", {}).get("temp", 25)
        humidity = weather.get("main", {}).get("humidity", 60)
        
        # Most crops like 20-30°C and 40-70% humidity
        temp_score = 1.0 if 20 <= temp <= 30 else 0.6 if 15 <= temp <= 35 else 0.3
        humidity_score = 1.0 if 40 <= humidity <= 70 else 0.7 if 30 <= humidity <= 80 else 0.4
        
        return (temp_score + humidity_score) / 2

    def _generate_explanation(
        self,
        crop: str,
        profit_per_ha: float,
        soil: Dict,
        season: str,
        price: float,
        soil_score: float,
        season_score: float
    ) -> List[str]:
        """Generate human-readable explanation for recommendation."""
        reasons = []
        
        # Profit reason
        if profit_per_ha >= 100000:
            reasons.append(f"Excellent profitability (₹{profit_per_ha:,.0f}/ha)")
        elif profit_per_ha >= 50000:
            reasons.append(f"Good profitability (₹{profit_per_ha:,.0f}/ha)")
        
        # Soil reason
        if soil_score >= 0.9:
            reasons.append(f"Soil type ({soil.get('soil_type')}) is ideal for {crop}")
        elif soil_score >= 0.7:
            reasons.append(f"Soil type is suitable for {crop}")
        
        # Season reason
        if season_score >= 0.9:
            reasons.append(f"Perfect for {season} season cultivation")
        
        # Price reason
        if price > 30:
            reasons.append("Strong market price and demand")
        
        return reasons[:3] if reasons else ["Recommended based on farm conditions"]


# Global instance
recommendation_engine = RecommendationEngine()
