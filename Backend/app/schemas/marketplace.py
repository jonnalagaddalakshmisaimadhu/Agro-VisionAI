from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price_per_unit: float
    unit: str
    stock_quantity: float
    location: Optional[str] = None
    is_organic: bool = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_unit: Optional[float] = None
    stock_quantity: Optional[float] = None
    is_organic: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    seller_id: int
    is_verified: bool
    rating: float
    total_reviews: int
    image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class EquipmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    price_per_day: float
    price_per_hour: Optional[float] = None
    location: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    features: Optional[List[str]] = None

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_day: Optional[float] = None
    price_per_hour: Optional[float] = None
    is_available: Optional[bool] = None

class EquipmentResponse(EquipmentBase):
    id: int
    owner_id: int
    is_available: bool
    rating: float
    total_rentals: int
    image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class RentalCreate(BaseModel):
    equipment_id: int
    start_date: datetime
    end_date: datetime

class RentalResponse(BaseModel):
    id: int
    equipment_id: int
    renter_id: int
    start_date: datetime
    end_date: datetime
    total_amount: float
    status: str
    payment_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
