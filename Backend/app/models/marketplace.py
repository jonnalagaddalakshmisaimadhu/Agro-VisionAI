from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(50), nullable=False)  # vegetables, grains, fruits, dairy, spices
    price_per_unit = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # kg, ton, piece, dozen
    stock_quantity = Column(Float, default=0)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    seller_name = Column(String(200), default="Local Farmer")
    phone_number = Column(String(50), default="9876543210")
    location = Column(String(200))
    is_organic = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    rating = Column(Float, default=4.8)
    total_reviews = Column(Integer, default=12)
    image_url = Column(Text, nullable=True)
    video_url = Column(Text, nullable=True)
    harvest_date = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    
    # Relationships
    seller = relationship("User", back_populates="products")

class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)  # tractor, harvester, tiller, pump, drone, leveler, seeder
    price_per_day = Column(Float, nullable=False)
    price_per_hour = Column(Float, default=0.0)
    price_per_acre = Column(Float, default=0.0)
    operator_available = Column(Boolean, default=False)
    operator_fee = Column(Float, default=0.0)
    fuel_included = Column(Boolean, default=False)
    horse_power = Column(String(50), default="45 HP")
    security_deposit = Column(Float, default=0.0)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner_name = Column(String(200), default="Equipment Partner")
    phone_number = Column(String(50), default="9876543210")
    location = Column(String(200))
    district = Column(String(100), default="Regional")
    specifications = Column(Text)  # JSON string
    features = Column(Text)  # JSON string
    is_available = Column(Boolean, default=True)
    rating = Column(Float, default=4.8)
    total_rentals = Column(Integer, default=5)
    image_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="equipment")
    rentals = relationship("Rental", back_populates="equipment", cascade="all, delete-orphan")

class Rental(Base):
    __tablename__ = "rentals"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    renter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    renter_name = Column(String(200), default="Farmer")
    renter_phone = Column(String(50), default="9876543210")
    renter_location = Column(String(200), default="Farm Field")
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    billing_mode = Column(String(20), default="day")  # day, hour, acre
    units_booked = Column(Float, default=1.0)
    with_operator = Column(Boolean, default=False)
    fuel_included = Column(Boolean, default=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")  # pending, confirmed, working, completed, cancelled
    payment_status = Column(String(20), default="pending")
    meter_reading_start = Column(String(50), nullable=True)
    meter_reading_end = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    equipment = relationship("Equipment", back_populates="rentals")
    renter = relationship("User", back_populates="rentals")
