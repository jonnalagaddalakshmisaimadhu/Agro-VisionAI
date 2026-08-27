from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class MarketplaceMessage(Base):
    __tablename__ = "marketplace_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    sender_name = Column(String(200), nullable=False)
    receiver_name = Column(String(200), nullable=False)
    message_text = Column(Text, nullable=False)
    is_offer = Column(Boolean, default=False)
    offered_price = Column(Float, nullable=True)
    offered_quantity = Column(Float, nullable=True)
    offer_status = Column(String(50), default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
