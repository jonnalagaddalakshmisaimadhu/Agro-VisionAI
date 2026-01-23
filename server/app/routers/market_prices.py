from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.market_prices import MarketPrice, PriceAlert
from app.services.market_prices import MarketPricesService
from app.core.security import verify_token
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Pydantic models for request/response
class MarketPriceResponse(BaseModel):
    id: int
    crop_name: str
    category: str
    current_price: float
    previous_price: Optional[float]
    price_change: Optional[float]
    price_change_amount: Optional[float]
    unit: str
    market_location: str
    market_type: str
    quality_grade: str
    trend: Optional[str]
    status: str
    source: Optional[str]
    last_updated: datetime
    min_price: Optional[float]
    max_price: Optional[float]
    avg_price: Optional[float]
    demand_level: Optional[str]
    supply_level: Optional[str]
    market_insights: Optional[str]
    is_verified: bool

    class Config:
        from_attributes = True

class PriceTrendResponse(BaseModel):
    crop_name: str
    current_price: float
    trend: str
    change_percentage: float
    location: str
    last_updated: datetime

class PriceAlertCreate(BaseModel):
    crop_name: str
    alert_type: str  # above, below, change
    target_price: float

class PriceAlertResponse(BaseModel):
    id: int
    crop_name: str
    alert_type: str
    target_price: float
    current_price: Optional[float]
    is_active: bool
    created_at: datetime
    triggered_at: Optional[datetime]

    class Config:
        from_attributes = True

@router.get("/prices", response_model=List[MarketPriceResponse])
async def get_market_prices(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by category (vegetables, fruits, grains)"),
    location: Optional[str] = Query(None, description="Filter by market location"),
    limit: int = Query(50, description="Number of results to return"),
    verified_only: bool = Query(False, description="Show only verified prices")
):
    """Get current market prices with optional filters"""
    service = MarketPricesService()
    
    query = db.query(MarketPrice).filter(MarketPrice.status == "active")
    
    if category:
        query = query.filter(MarketPrice.category == category)
    
    if location:
        query = query.filter(MarketPrice.market_location.ilike(f"%{location}%"))
    
    if verified_only:
        query = query.filter(MarketPrice.is_verified == True)
    
    prices = query.order_by(MarketPrice.last_updated.desc()).limit(limit).all()
    return prices

@router.get("/prices/trends", response_model=List[PriceTrendResponse])
async def get_price_trends(
    db: Session = Depends(get_db),
    crop_name: Optional[str] = Query(None, description="Filter by specific crop"),
    days: int = Query(7, description="Number of days to look back")
):
    """Get price trends and analysis"""
    service = MarketPricesService()
    trends = service.get_price_trends(db, crop_name, days)
    return trends

@router.post("/prices/refresh")
async def refresh_market_prices(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually refresh market prices from external APIs"""
    service = MarketPricesService()
    
    # Run in background to avoid timeout
    background_tasks.add_task(service.fetch_live_prices, db)
    
    return {
        "message": "Market prices refresh initiated",
        "status": "processing",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/prices/vegetables", response_model=List[MarketPriceResponse])
async def get_vegetable_prices(
    db: Session = Depends(get_db),
    location: Optional[str] = Query(None, description="Filter by market location"),
    limit: int = Query(20, description="Number of results to return")
):
    """Get current vegetable prices specifically"""
    service = MarketPricesService()
    prices = service.get_market_prices(db, category="vegetables", location=location, limit=limit)
    return prices

@router.get("/prices/fruits", response_model=List[MarketPriceResponse])
async def get_fruit_prices(
    db: Session = Depends(get_db),
    location: Optional[str] = Query(None, description="Filter by market location"),
    limit: int = Query(20, description="Number of results to return")
):
    """Get current fruit prices specifically"""
    service = MarketPricesService()
    prices = service.get_market_prices(db, category="fruits", location=location, limit=limit)
    return prices

@router.get("/prices/grains", response_model=List[MarketPriceResponse])
async def get_grain_prices(
    db: Session = Depends(get_db),
    location: Optional[str] = Query(None, description="Filter by market location"),
    limit: int = Query(20, description="Number of results to return")
):
    """Get current grain prices specifically"""
    service = MarketPricesService()
    prices = service.get_market_prices(db, category="grains", location=location, limit=limit)
    return prices

@router.get("/prices/{crop_name}", response_model=List[MarketPriceResponse])
async def get_crop_prices(
    crop_name: str,
    db: Session = Depends(get_db),
    location: Optional[str] = Query(None, description="Filter by market location")
):
    """Get prices for a specific crop"""
    query = db.query(MarketPrice).filter(
        MarketPrice.crop_name.ilike(f"%{crop_name}%"),
        MarketPrice.status == "active"
    )
    
    if location:
        query = query.filter(MarketPrice.market_location.ilike(f"%{location}%"))
    
    prices = query.order_by(MarketPrice.last_updated.desc()).all()
    
    if not prices:
        raise HTTPException(
            status_code=404,
            detail=f"No prices found for crop: {crop_name}"
        )
    
    return prices

# Price Alerts endpoints
@router.post("/alerts", response_model=PriceAlertResponse)
async def create_price_alert(
    alert: PriceAlertCreate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a new price alert for a user"""
    # Check if crop exists in market prices
    existing_price = db.query(MarketPrice).filter(
        MarketPrice.crop_name.ilike(f"%{alert.crop_name}%"),
        MarketPrice.status == "active"
    ).first()
    
    if not existing_price:
        raise HTTPException(
            status_code=404,
            detail=f"Crop '{alert.crop_name}' not found in market prices"
        )
    
    # Create new alert
    price_alert = PriceAlert(
        user_id=current_user.id,
        crop_name=alert.crop_name,
        alert_type=alert.alert_type,
        target_price=alert.target_price,
        current_price=existing_price.current_price
    )
    
    db.add(price_alert)
    db.commit()
    db.refresh(price_alert)
    
    return price_alert

@router.get("/alerts", response_model=List[PriceAlertResponse])
async def get_user_price_alerts(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all price alerts for the current user"""
    alerts = db.query(PriceAlert).filter(
        PriceAlert.user_id == current_user.id
    ).order_by(PriceAlert.created_at.desc()).all()
    
    return alerts

@router.delete("/alerts/{alert_id}")
async def delete_price_alert(
    alert_id: int,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Delete a price alert"""
    alert = db.query(PriceAlert).filter(
        PriceAlert.id == alert_id,
        PriceAlert.user_id == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Price alert not found"
        )
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Price alert deleted successfully"}

@router.get("/history")
async def get_price_history(
    crops: Optional[List[str]] = Query(["Wheat", "Rice", "Tomato"]),
    db: Session = Depends(get_db)
):
    """Get 6-month price history for charts"""
    service = MarketPricesService()
    history = service.get_monthly_price_history(db, crops)
    return history

@router.get("/prices/stats/summary")
async def get_market_stats(
    db: Session = Depends(get_db)
):
    """Get market statistics summary"""
    total_crops = db.query(MarketPrice).filter(MarketPrice.status == "active").count()
    verified_prices = db.query(MarketPrice).filter(
        MarketPrice.status == "active",
        MarketPrice.is_verified == True
    ).count()
    
    # Get price trends
    up_trends = db.query(MarketPrice).filter(
        MarketPrice.status == "active",
        MarketPrice.trend == "up"
    ).count()
    
    down_trends = db.query(MarketPrice).filter(
        MarketPrice.status == "active",
        MarketPrice.trend == "down"
    ).count()
    
    stable_trends = db.query(MarketPrice).filter(
        MarketPrice.status == "active",
        MarketPrice.trend == "stable"
    ).count()
    
    return {
        "total_crops": total_crops,
        "verified_prices": verified_prices,
        "trends": {
            "up": up_trends,
            "down": down_trends,
            "stable": stable_trends
        },
        "last_updated": datetime.utcnow().isoformat()
    }
