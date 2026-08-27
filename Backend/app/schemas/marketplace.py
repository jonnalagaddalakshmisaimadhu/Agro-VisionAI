from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price_per_unit: float
    unit: str = "kg"
    stock_quantity: float = 100.0
    location: Optional[str] = None
    is_organic: bool = False
    seller_name: Optional[str] = "Farmer"
    phone_number: Optional[str] = "9876543210"
    harvest_date: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None


class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_unit: Optional[float] = None
    stock_quantity: Optional[float] = None
    is_organic: Optional[bool] = None
    phone_number: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    seller_id: Optional[int] = None
    is_verified: bool = True
    rating: float = 4.8
    total_reviews: int = 12
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class EquipmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    price_per_day: float
    price_per_hour: Optional[float] = 0.0
    price_per_acre: Optional[float] = 0.0
    operator_available: Optional[bool] = False
    operator_fee: Optional[float] = 0.0
    fuel_included: Optional[bool] = False
    horse_power: Optional[str] = "45 HP"
    security_deposit: Optional[float] = 0.0
    location: Optional[str] = None
    district: Optional[str] = "Regional"
    owner_name: Optional[str] = "Equipment Partner"
    phone_number: Optional[str] = "9876543210"
    specifications: Optional[str] = None
    features: Optional[str] = None
    image_url: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_day: Optional[float] = None
    price_per_hour: Optional[float] = None
    price_per_acre: Optional[float] = None
    operator_available: Optional[bool] = None
    operator_fee: Optional[float] = None
    fuel_included: Optional[bool] = None
    is_available: Optional[bool] = None

class EquipmentResponse(EquipmentBase):
    id: int
    owner_id: Optional[int] = None
    is_available: bool = True
    rating: float = 4.8
    total_rentals: int = 5
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class RentalCreate(BaseModel):
    equipment_id: int
    start_date: datetime
    end_date: datetime
    billing_mode: Optional[str] = "day"
    units_booked: Optional[float] = 1.0
    with_operator: Optional[bool] = False
    fuel_included: Optional[bool] = False
    renter_name: Optional[str] = "Farmer"
    renter_phone: Optional[str] = "9876543210"
    renter_location: Optional[str] = "Farm Field"
    total_amount: Optional[float] = None
    notes: Optional[str] = None

class RentalResponse(BaseModel):
    id: int
    equipment_id: int
    renter_id: Optional[int] = None
    renter_name: Optional[str] = "Farmer"
    renter_phone: Optional[str] = "9876543210"
    renter_location: Optional[str] = "Farm Field"
    start_date: datetime
    end_date: datetime
    billing_mode: str = "day"
    units_booked: float = 1.0
    with_operator: bool = False
    fuel_included: bool = False
    total_amount: float
    status: str = "pending"
    payment_status: str = "pending"
    meter_reading_start: Optional[str] = None
    meter_reading_end: Optional[str] = None
    notes: Optional[str] = None
    equipment: Optional[EquipmentResponse] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

