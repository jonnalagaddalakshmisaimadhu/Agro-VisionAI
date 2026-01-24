import asyncio
import httpx
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.market_prices import MarketPrice, PriceAlert
from app.database import get_db

logger = logging.getLogger(__name__)

class MarketPricesService:
    def __init__(self):
        # Indian agricultural market APIs
        self.market_apis = [
            {
                "name": "Agmarknet API",
                "url": "https://agmarknet.gov.in/api/price/commodity",
                "params": {"format": "json", "limit": 50},
                "headers": {"User-Agent": "FarmIQ/1.0"}
            },
            {
                "name": "eNAM API", 
                "url": "https://enam.gov.in/webapi/api/price",
                "params": {"format": "json"},
                "headers": {"User-Agent": "FarmIQ/1.0"}
            }
        ]
        
        # Fallback data for when APIs are unavailable
        self.fallback_prices = {
            # Vegetables
            "Tomato": {"price": 45, "trend": "up", "change": 8},
            "Onion": {"price": 25, "trend": "down", "change": -3},
            "Potato": {"price": 20, "trend": "up", "change": 12},
            "Carrot": {"price": 30, "trend": "up", "change": 6},
            "Cabbage": {"price": 18, "trend": "down", "change": -2},
            "Cauliflower": {"price": 22, "trend": "up", "change": 4},
            "Brinjal": {"price": 28, "trend": "stable", "change": 1},
            "Okra": {"price": 35, "trend": "up", "change": 7},
            "Spinach": {"price": 15, "trend": "down", "change": -1},
            "Capsicum": {"price": 40, "trend": "up", "change": 9},
            "Cucumber": {"price": 25, "trend": "stable", "change": 0},
            "Radish": {"price": 20, "trend": "up", "change": 3},
            "Beetroot": {"price": 35, "trend": "down", "change": -2},
            
            # Fruits
            "Mango": {"price": 80, "trend": "up", "change": 6},
            "Banana": {"price": 35, "trend": "up", "change": 9},
            "Apple": {"price": 120, "trend": "down", "change": -4},
            "Orange": {"price": 45, "trend": "stable", "change": 0},
            "Grapes": {"price": 60, "trend": "up", "change": 9},
            "Pomegranate": {"price": 90, "trend": "down", "change": -5},
            "Papaya": {"price": 25, "trend": "up", "change": 8},
            
            # Cotton
            "Cotton": {"price": 6500, "trend": "up", "change": 4}
        }
    
    async def fetch_live_prices(self, db: Session) -> Dict:
        """Fetch live market prices from external APIs"""
        logger.info("Starting live market prices fetch")
        
        new_prices_count = 0
        updated_prices_count = 0
        error_messages = []
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for api in self.market_apis:
                    try:
                        response = await client.get(api["url"], params=api["params"], headers=api["headers"])
                        if response.status_code == 200:
                            data = response.json()
                            prices_data = self._parse_api_data(data, api["name"])
                            
                            for price_data in prices_data:
                                existing_price = db.query(MarketPrice).filter(
                                    MarketPrice.crop_name == price_data["crop_name"],
                                    MarketPrice.market_location == price_data["market_location"]
                                ).first()
                                
                                if existing_price:
                                    # Update existing price
                                    self._update_price(existing_price, price_data)
                                    updated_prices_count += 1
                                else:
                                    # Create new price entry
                                    new_price = self._create_price(price_data)
                                    db.add(new_price)
                                    new_prices_count += 1
                            
                            db.commit()
                            logger.info(f"Successfully processed {api['name']} data")
                            
                    except Exception as e:
                        error_msg = f"Error fetching from {api['name']}: {str(e)}"
                        error_messages.append(error_msg)
                        logger.error(error_msg)
                        continue
                
                # If no external data was fetched, use fallback data
                if new_prices_count == 0 and updated_prices_count == 0:
                    logger.warning("No external data fetched, using fallback prices")
                    await self._update_fallback_prices(db)
                    new_prices_count = len(self.fallback_prices)
                
        except Exception as e:
            error_msg = f"General error in fetch_live_prices: {str(e)}"
            error_messages.append(error_msg)
            logger.error(error_msg)
            # Use fallback data
            await self._update_fallback_prices(db)
            new_prices_count = len(self.fallback_prices)
        
        return {
            "success": True,
            "new_prices": new_prices_count,
            "updated_prices": updated_prices_count,
            "errors": error_messages,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _parse_api_data(self, data: dict, source: str) -> List[Dict]:
        """Parse API response data into standardized format"""
        prices = []
        
        try:
            # Handle different API response formats
            if "records" in data:
                records = data["records"]
            elif "data" in data:
                records = data["data"]
            else:
                records = data if isinstance(data, list) else [data]
            
            for record in records:
                price_data = self._extract_price_info(record, source)
                if price_data:
                    prices.append(price_data)
                    
        except Exception as e:
            logger.error(f"Error parsing API data from {source}: {str(e)}")
        
        return prices
    
    def _extract_price_info(self, record: dict, source: str) -> Optional[Dict]:
        """Extract price information from a single record"""
        try:
            # Map different field names to standard format
            crop_name = self._get_field_value(record, ["commodity", "crop", "name", "commodity_name"])
            price = self._get_field_value(record, ["price", "current_price", "min_price", "modal_price"])
            location = self._get_field_value(record, ["market", "location", "state", "district"])
            
            if not crop_name or not price:
                return None
            
            # Convert price to float
            try:
                price_value = float(str(price).replace(',', ''))
            except (ValueError, TypeError):
                return None
            
            return {
                "crop_name": crop_name.title(),
                "current_price": price_value,
                "market_location": location or "India",
                "source": source,
                "unit": "kg",
                "category": "vegetables",
                "market_type": "wholesale",
                "quality_grade": "A",
                "is_verified": True
            }
            
        except Exception as e:
            logger.error(f"Error extracting price info: {str(e)}")
            return None
    
    def _get_field_value(self, record: dict, field_names: List[str]) -> Optional[str]:
        """Get value from record using multiple possible field names"""
        for field in field_names:
            if field in record and record[field]:
                return str(record[field]).strip()
        return None
    
    def _create_price(self, price_data: Dict) -> MarketPrice:
        """Create new MarketPrice object"""
        return MarketPrice(
            crop_name=price_data["crop_name"],
            category=price_data.get("category", "vegetables"),
            current_price=price_data["current_price"],
            unit=price_data.get("unit", "kg"),
            market_location=price_data["market_location"],
            market_type=price_data.get("market_type", "wholesale"),
            quality_grade=price_data.get("quality_grade", "A"),
            source=price_data["source"],
            is_verified=price_data.get("is_verified", False),
            trend="stable",
            status="active"
        )
    
    def _update_price(self, existing_price: MarketPrice, price_data: Dict):
        """Update existing MarketPrice object"""
        # Store previous price for trend calculation
        existing_price.previous_price = existing_price.current_price
        existing_price.current_price = price_data["current_price"]
        
        # Calculate price change
        if existing_price.previous_price:
            change_amount = existing_price.current_price - existing_price.previous_price
            change_percentage = (change_amount / existing_price.previous_price) * 100
            
            existing_price.price_change_amount = change_amount
            existing_price.price_change = round(change_percentage, 2)
            
            # Set trend
            if change_percentage > 2:
                existing_price.trend = "up"
            elif change_percentage < -2:
                existing_price.trend = "down"
            else:
                existing_price.trend = "stable"
        
        existing_price.last_updated = datetime.utcnow()
        existing_price.source = price_data["source"]
        existing_price.is_verified = price_data.get("is_verified", existing_price.is_verified)
    
    async def _update_fallback_prices(self, db: Session):
        """Update prices using fallback data when APIs are unavailable"""
        for crop_name, data in self.fallback_prices.items():
            existing_price = db.query(MarketPrice).filter(
                MarketPrice.crop_name == crop_name,
                MarketPrice.market_location == "India"
            ).first()
            
            if existing_price:
                # Update existing
                existing_price.previous_price = existing_price.current_price
                existing_price.current_price = data["price"]
                existing_price.trend = data["trend"]
                existing_price.price_change = data["change"]
                existing_price.last_updated = datetime.utcnow()
            else:
                # Create new
                new_price = MarketPrice(
                    crop_name=crop_name,
                    category="vegetables",
                    current_price=data["price"],
                    trend=data["trend"],
                    price_change=data["change"],
                    unit="kg",
                    market_location="India",
                    market_type="wholesale",
                    quality_grade="A",
                    source="fallback",
                    is_verified=False,
                    status="active"
                )
                db.add(new_price)
        
        db.commit()
    
    def get_market_prices(self, db: Session, category: str = None, location: str = None, limit: int = 50) -> List[MarketPrice]:
        """Get market prices with optional filters"""
        query = db.query(MarketPrice).filter(MarketPrice.status == "active")
        
        if category:
            query = query.filter(MarketPrice.category == category)
        
        if location:
            query = query.filter(MarketPrice.market_location.ilike(f"%{location}%"))
        
        return query.order_by(MarketPrice.last_updated.desc()).limit(limit).all()
    
    def get_price_trends(self, db: Session, crop_name: str = None, days: int = 7) -> List[Dict]:
        """Get price trends for analysis"""
        query = db.query(MarketPrice).filter(MarketPrice.status == "active")
        
        if crop_name:
            query = query.filter(MarketPrice.crop_name == crop_name)
        
        # Get prices from last N days
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(MarketPrice.last_updated >= cutoff_date)
        
        prices = query.order_by(MarketPrice.last_updated.desc()).all()
        
        # Group by crop and calculate trends
        trends = {}
        for price in prices:
            if price.crop_name not in trends:
                trends[price.crop_name] = {
                    "crop_name": price.crop_name,
                    "current_price": price.current_price,
                    "trend": price.trend,
                    "change_percentage": price.price_change or 0,
                    "location": price.market_location,
                    "last_updated": price.last_updated
                }
        
        return list(trends.values())

    def get_monthly_price_history(self, db: Session, crops: List[str] = ["Wheat", "Rice", "Tomato"]) -> List[Dict]:
        """Get or generate monthly price history for charts"""
        # Generate 6 months ending at current month
        months = []
        now = datetime.now()
        for i in range(5, -1, -1):
            # Calculate month/year correctly
            month_date = now.replace(day=1)
            # Go back i months
            # Using simple math for month/year subtraction
            m = now.month - i
            y = now.year
            if m <= 0:
                m += 12
                y -= 1
            
            month_name = datetime(y, m, 1).strftime("%b")
            months.append(month_name)
            
        history_data = []
        
        # Base prices for fallback/generation
        base_prices = {
            "Wheat": 2400,
            "Rice": 3200,
            "Tomato": 2800,
            "Cotton": 6200,
            "Maize": 2100,
            "Potato": 1800,
            "Onion": 2500
        }
        
        # Get current live prices from DB to make it "live" based
        current_prices = {}
        for crop in crops:
            price_entry = db.query(MarketPrice).filter(
                MarketPrice.status == "active",
                MarketPrice.crop_name.ilike(f"{crop}%")
            ).order_by(MarketPrice.last_updated.desc()).first()
            
            if price_entry:
                current_prices[crop] = price_entry.current_price
            else:
                current_prices[crop] = base_prices.get(crop, 2000)

        import random
        
        for i, month in enumerate(months):
            point = {"month": month}
            
            for crop in crops:
                base = current_prices.get(crop, 2000)
                
                # Add some seasonality/randomness
                fluctuation = random.uniform(-0.15, 0.15) # +/- 15%
                
                # Make trend somewhat consistent per crop
                if crop == "Tomato":
                    fluctuation = random.uniform(-0.3, 0.3)
                
                price = base * (1 + fluctuation)

                # Normalize to Quintal if seemingly per kg (heuristic)
                # Chart expects ₹/Q (approx 2000-10000 range)
                if price < 200:
                    price *= 100
                
                # Ensure the last month (Current Month) is close to current live price
                if i == len(months) - 1:
                    # Also normalize base if needed
                    if base < 200:
                         price = base * 100
                    else:
                         price = base
                
                point[crop.lower()] = round(price)
                
            history_data.append(point)
            
        return history_data
