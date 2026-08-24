from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.marketplace import Equipment, Rental
from app.models.user import User
from app.schemas.marketplace import (
    EquipmentCreate, 
    EquipmentResponse, 
    EquipmentUpdate,
    RentalCreate,
    RentalResponse
)
from app.core.security import verify_token

router = APIRouter()

@router.post("/equipment", response_model=EquipmentResponse)
async def create_equipment(
    equipment: EquipmentCreate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a new equipment listing."""
    db_equipment = Equipment(
        **equipment.dict(),
        owner_id=current_user.id
    )
    
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    
    return db_equipment

@router.get("/equipment", response_model=List[EquipmentResponse])
async def get_equipment(
    db: Session = Depends(get_db),
    equipment_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    available_only: bool = Query(True),
    limit: int = Query(20),
    offset: int = Query(0)
):
    """Get equipment with optional filters."""
    query = db.query(Equipment)
    
    if equipment_type:
        query = query.filter(Equipment.type == equipment_type)
    
    if location:
        query = query.filter(Equipment.location.ilike(f"%{location}%"))
    
    if available_only:
        query = query.filter(Equipment.is_available == True)
    
    equipment_list = query.offset(offset).limit(limit).all()
    return equipment_list

@router.get("/equipment/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment_by_id(equipment_id: int, db: Session = Depends(get_db)):
    """Get a specific equipment by ID."""
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    return equipment

@router.put("/equipment/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,
    equipment_update: EquipmentUpdate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update equipment (only by owner)."""
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    if equipment.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this equipment"
        )
    
    update_data = equipment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipment, field, value)
    
    db.commit()
    db.refresh(equipment)
    
    return equipment

@router.delete("/equipment/{equipment_id}")
async def delete_equipment(
    equipment_id: int,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Delete equipment (only by owner)."""
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    if equipment.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this equipment"
        )
    
    db.delete(equipment)
    db.commit()
    
    return {"message": "Equipment deleted successfully"}

@router.get("/my-equipment", response_model=List[EquipmentResponse])
async def get_my_equipment(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get current user's equipment."""
    equipment = db.query(Equipment).filter(Equipment.owner_id == current_user.id).all()
    return equipment

@router.post("/rentals", response_model=RentalResponse)
async def create_rental(
    rental: RentalCreate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a new rental request."""
    # Check if equipment exists and is available
    equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    if not equipment.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment is not available"
        )
    
    # Calculate total amount
    days = (rental.end_date - rental.start_date).days
    total_amount = equipment.price_per_day * days
    
    db_rental = Rental(
        equipment_id=rental.equipment_id,
        renter_id=current_user.id,
        start_date=rental.start_date,
        end_date=rental.end_date,
        total_amount=total_amount
    )
    
    db.add(db_rental)
    db.commit()
    db.refresh(db_rental)
    
    return db_rental

@router.get("/rentals", response_model=List[RentalResponse])
async def get_rentals(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None)
):
    """Get user's rentals (as renter or owner)."""
    # Get rentals where user is renter
    renter_rentals = db.query(Rental).filter(Rental.renter_id == current_user.id)
    
    # Get rentals where user owns the equipment
    owner_rentals = db.query(Rental).join(Equipment).filter(Equipment.owner_id == current_user.id)
    
    # Combine and filter by status if provided
    all_rentals = renter_rentals.union(owner_rentals)
    
    if status_filter:
        all_rentals = all_rentals.filter(Rental.status == status_filter)
    
    rentals = all_rentals.order_by(Rental.created_at.desc()).all()
    return rentals

@router.put("/rentals/{rental_id}/status")
async def update_rental_status(
    rental_id: int,
    new_status: str,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update rental status (only by equipment owner)."""
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check if user owns the equipment
    equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
    if equipment.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this rental"
        )
    
    rental.status = new_status
    db.commit()
    
    return {"message": f"Rental status updated to {new_status}"}

@router.get("/equipment-types")
async def get_equipment_types():
    """Get available equipment types."""
    return {
        "types": [
            {"id": "tractor", "name": "Tractor"},
            {"id": "harvester", "name": "Harvester"},
            {"id": "tiller", "name": "Tiller"},
            {"id": "pump", "name": "Water Pump"},
            {"id": "sprayer", "name": "Sprayer"},
            {"id": "cultivator", "name": "Cultivator"},
            {"id": "seeder", "name": "Seeder"},
            {"id": "plow", "name": "Plow"}
        ]
    }
