from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base

class MarketPrice(Base):
    __tablename__ = "market_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # vegetables, fruits, grains, etc.
    current_price = Column(Float, nullable=False)
    previous_price = Column(Float)
    price_change = Column(Float)  # percentage change
    price_change_amount = Column(Float)  # absolute change
    unit = Column(String(20), nullable=False, default="kg")  # kg, ton, piece, etc.
    market_location = Column(String(100), nullable=False)  # city/state
    market_type = Column(String(50), default="wholesale")  # wholesale, retail, mandi
    quality_grade = Column(String(20), default="A")  # A, B, C grade
    trend = Column(String(20))  # up, down, stable
    status = Column(String(20), default="active")  # active, inactive
    source = Column(String(100))  # API source name
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional market data
    min_price = Column(Float)  # minimum price in the market
    max_price = Column(Float)  # maximum price in the market
    avg_price = Column(Float)  # average price
    demand_level = Column(String(20))  # high, medium, low
    supply_level = Column(String(20))  # high, medium, low
    market_insights = Column(Text)  # additional market information
    is_verified = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<MarketPrice(crop={self.crop_name}, price={self.current_price}, location={self.market_location})>"

class PriceAlert(Base):
    __tablename__ = "price_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    crop_name = Column(String(100), nullable=False)
    alert_type = Column(String(20), nullable=False)  # above, below, change
    target_price = Column(Float, nullable=False)
    current_price = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    triggered_at = Column(DateTime(timezone=True))
    
    def __repr__(self):
        return f"<PriceAlert(user_id={self.user_id}, crop={self.crop_name}, type={self.alert_type})>"
