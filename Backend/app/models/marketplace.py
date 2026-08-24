from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(50), nullable=False)  # vegetables, grains, fruits, dairy
    price_per_unit = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # kg, ton, piece
    stock_quantity = Column(Float, default=0)
    seller_id = Column(Integer, ForeignKey("users.id"))
    location = Column(String(200))
    is_organic = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    image_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    seller = relationship("User", back_populates="products")

class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)  # tractor, harvester, tiller, pump
    price_per_day = Column(Float, nullable=False)
    price_per_hour = Column(Float)
    owner_id = Column(Integer, ForeignKey("users.id"))
    location = Column(String(200))
    specifications = Column(Text)  # JSON string
    features = Column(Text)  # JSON string
    is_available = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    total_rentals = Column(Integer, default=0)
    image_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="equipment")
    rentals = relationship("Rental", back_populates="equipment", cascade="all, delete-orphan")

class Rental(Base):
    __tablename__ = "rentals"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    renter_id = Column(Integer, ForeignKey("users.id"))
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")  # pending, active, completed, cancelled
    payment_status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    equipment = relationship("Equipment", back_populates="rentals")
    renter = relationship("User", back_populates="rentals")

