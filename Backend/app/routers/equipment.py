from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json
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
from app.core.security import verify_token, verify_token_optional
from app.schemas.user import TokenData

router = APIRouter()

SEED_EQUIPMENT = [
    {
        "name": "Mahindra 575 DI Sarpanch Tractor",
        "type": "tractor",
        "description": "45 HP heavy duty diesel tractor with high backup torque. Ideal for primary tillage, rotavator, and heavy haulage.",
        "price_per_day": 2400.0,
        "price_per_hour": 350.0,
        "price_per_acre": 850.0,
        "operator_available": True,
        "operator_fee": 400.0,
        "fuel_included": False,
        "horse_power": "45 HP",
        "security_deposit": 2000.0,
        "location": "Guntur, Andhra Pradesh",
        "district": "Guntur",
        "owner_name": "Ram Charan",
        "phone_number": "6305936623",
        "rating": 4.9,
        "total_rentals": 42,
        "image_url": "/equipment/mahindra_tractor.jpg",
        "specifications": {"power": "45 HP", "fuel": "Diesel", "cylinders": "4", "transmission": "8 Forward + 2 Reverse", "year": "2023"},
        "features": ["Heavy Duty Rotavator Attached", "Dual Clutch", "Power Steering", "Hydraulic Lift (1600 kg)"]
    },
    {
        "name": "John Deere 5050D PowerPro Tractor",
        "type": "tractor",
        "description": "50 HP 2WD/4WD tractor with Collarshift gearbox and top PTO efficiency for disc harrows, laser levelers, and balers.",
        "price_per_day": 2800.0,
        "price_per_hour": 400.0,
        "price_per_acre": 950.0,
        "operator_available": True,
        "operator_fee": 500.0,
        "fuel_included": False,
        "horse_power": "50 HP",
        "security_deposit": 2500.0,
        "location": "Vijayawada, Andhra Pradesh",
        "district": "Krishna",
        "owner_name": "Charith",
        "phone_number": "8341505040",
        "rating": 4.95,
        "total_rentals": 68,
        "image_url": "/equipment/john_deere_tractor.jpg",
        "specifications": {"power": "50 HP", "fuel": "Diesel", "pto": "540 RPM", "year": "2024"},
        "features": ["Reverse PTO", "Oil Immersed Disc Brakes", "JDLink GPS Telematics Enabled", "AC Cabin Option"]
    },
    {
        "name": "Kubota DC-68G Combine Harvester",
        "type": "harvester",
        "description": "High-throughput tracked paddy & wheat combine harvester. Harvests and threshes up to 2.5 acres per hour with minimal grain loss.",
        "price_per_day": 9500.0,
        "price_per_hour": 1400.0,
        "price_per_acre": 1600.0,
        "operator_available": True,
        "operator_fee": 800.0,
        "fuel_included": True,
        "horse_power": "68 HP",
        "security_deposit": 5000.0,
        "location": "Bapatla, Andhra Pradesh",
        "district": "Bapatla",
        "owner_name": "Sai Madhu",
        "phone_number": "8639668662",
        "rating": 4.85,
        "total_rentals": 31,
        "image_url": "/equipment/combine_harvester.jpg",
        "specifications": {"power": "68 HP Turbocharged", "fuel": "Diesel Included", "grain_tank": "1250 Litres", "year": "2023"},
        "features": ["Rubber Crawlers for Wet Mud Fields", "Dual Threshing Rotor", "Straw Chopper", "Night LED Work Lights"]
    },
    {
        "name": "DJI Agras T40 Smart Spraying Drone",
        "type": "drone",
        "description": "40 kg payload agricultural drone with dual atomized centrifugal spray discs. Sprays 40 acres per hour with millimeter precision.",
        "price_per_day": 4500.0,
        "price_per_hour": 800.0,
        "price_per_acre": 350.0,
        "operator_available": True,
        "operator_fee": 0.0,  # Pilot included in package
        "fuel_included": True,
        "horse_power": "Electric 30,000 mAh",
        "security_deposit": 3000.0,
        "location": "Amaravati, Andhra Pradesh",
        "district": "Guntur",
        "owner_name": "Sai Madhu",
        "phone_number": "8639668662",
        "rating": 5.0,
        "total_rentals": 54,
        "image_url": "/equipment/spraying_drone.jpg",
        "specifications": {"payload": "40 Liters", "coverage": "40 Acres/hr", "battery": "Fast 9-Min Charge", "year": "2024"},
        "features": ["DGCA Certified Pilot Included", "Omnidirectional Obstacle Radar", "Active RTK Centimeter GPS", "Ultra-fine Droplet Control"]
    },
    {
        "name": "Shaktiman 7-Foot Rotary Tiller (Rotavator)",
        "type": "tiller",
        "description": "Heavy duty Boron steel multi-speed rotavator for single-pass seedbed preparation and stubble incorporation.",
        "price_per_day": 1200.0,
        "price_per_hour": 180.0,
        "price_per_acre": 450.0,
        "operator_available": False,
        "operator_fee": 0.0,
        "fuel_included": False,
        "horse_power": "Matches 45-60 HP Tractor",
        "security_deposit": 1000.0,
        "location": "Tenali, Andhra Pradesh",
        "district": "Guntur",
        "owner_name": "Ram Charan",
        "phone_number": "6305936623",
        "rating": 4.8,
        "total_rentals": 26,
        "image_url": "/equipment/rotary_tiller.jpg",
        "specifications": {"working_width": "2.1 meters", "blades": "54 L-type Boron Steel", "weight": "495 kg", "year": "2023"},
        "features": ["Side Gear Drive in Oil Bath", "Adjustable Depth Skids", "Trailing Board Spring Damper"]
    },
    {
        "name": "Spectra Precision Laser Land Leveler",
        "type": "leveler",
        "description": "Dual transmitter laser land leveler that flattens soil with millimeter grade accuracy, saving up to 30% irrigation water and increasing yield.",
        "price_per_day": 3500.0,
        "price_per_hour": 500.0,
        "price_per_acre": 800.0,
        "operator_available": True,
        "operator_fee": 450.0,
        "fuel_included": False,
        "horse_power": "Requires 50+ HP Tractor",
        "security_deposit": 2000.0,
        "location": "Krishna District, Andhra Pradesh",
        "district": "Krishna",
        "owner_name": "Charith",
        "phone_number": "8341505040",
        "rating": 4.9,
        "total_rentals": 39,
        "image_url": "/equipment/laser_leveler.jpg",
        "specifications": {"range": "800 Meter Diameter", "accuracy": "±1.5 mm per 30m", "blade_width": "8 Feet", "year": "2024"},
        "features": ["30% Water Savings", "Uniform Seed Germination", "Heavy Duty Scraper Bucket", "Laser Transmitter & Mast"]
    },
    {
        "name": "Kirloskar 7.5 HP Solar Mobile Water Pump",
        "type": "pump",
        "description": "Trolley-mounted solar irrigation pump unit with portable foldable 5kW PV panels. Operates with zero diesel and zero grid electricity.",
        "price_per_day": 1500.0,
        "price_per_hour": 220.0,
        "price_per_acre": 400.0,
        "operator_available": False,
        "operator_fee": 0.0,
        "fuel_included": True,  # 100% Solar power
        "horse_power": "7.5 HP Submersible/Monoblock",
        "security_deposit": 1500.0,
        "location": "Guntur Rural, Andhra Pradesh",
        "district": "Guntur",
        "owner_name": "Ram Charan",
        "phone_number": "6305936623",
        "rating": 4.75,
        "total_rentals": 19,
        "image_url": "/equipment/solar_pump.jpg",
        "specifications": {"discharge": "65,000 Litres/hr", "head": "50 Meters", "power": "5kW Solar Array", "year": "2023"},
        "features": ["Zero Running Cost (Pure Solar)", "Towable Mobile Trailer", "MPPT Inverter", "Automatic Dry Run Cutoff"]
    }
]

_is_equipment_seeded = False

def ensure_seed_data(db: Session):
    """Seed initial equipment if table is empty."""
    global _is_equipment_seeded
    if _is_equipment_seeded:
        return
    try:
        count = db.query(Equipment).count()
        if count < 3:
            for eq_data in SEED_EQUIPMENT:
                spec_str = json.dumps(eq_data.get("specifications", {})) if isinstance(eq_data.get("specifications"), dict) else str(eq_data.get("specifications", "{}"))
                feat_str = json.dumps(eq_data.get("features", [])) if isinstance(eq_data.get("features"), list) else str(eq_data.get("features", "[]"))
                
                new_eq = Equipment(
                    name=eq_data["name"],
                    description=eq_data["description"],
                    type=eq_data["type"],
                    price_per_day=eq_data["price_per_day"],
                    price_per_hour=eq_data.get("price_per_hour", 0.0),
                    price_per_acre=eq_data.get("price_per_acre", 0.0),
                    operator_available=eq_data.get("operator_available", False),
                    operator_fee=eq_data.get("operator_fee", 0.0),
                    fuel_included=eq_data.get("fuel_included", False),
                    horse_power=eq_data.get("horse_power", "45 HP"),
                    security_deposit=eq_data.get("security_deposit", 0.0),
                    location=eq_data["location"],
                    district=eq_data.get("district", "Regional"),
                    owner_name=eq_data["owner_name"],
                    phone_number=eq_data["phone_number"],
                    rating=eq_data["rating"],
                    total_rentals=eq_data["total_rentals"],
                    image_url=eq_data["image_url"],
                    specifications=spec_str,
                    features=feat_str,
                    is_available=True
                )
                db.add(new_eq)
            db.commit()
        _is_equipment_seeded = True
    except Exception as e:
        print(f"Error seeding equipment: {e}")
        db.rollback()

@router.post("", response_model=EquipmentResponse)
@router.post("/", response_model=EquipmentResponse)
@router.post("/equipment", response_model=EquipmentResponse)
async def create_equipment(
    equipment: EquipmentCreate,
    current_token: Optional[TokenData] = Depends(verify_token_optional),
    db: Session = Depends(get_db)
):
    """Create a new equipment listing."""
    user_id = None
    if current_token:
        user = db.query(User).filter(User.username == current_token.username).first()
        if user:
            user_id = user.id
            
    db_equipment = Equipment(
        **equipment.dict(),
        owner_id=user_id
    )
    
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    
    return db_equipment

@router.get("", response_model=List[EquipmentResponse])
@router.get("/", response_model=List[EquipmentResponse])
@router.get("/equipment", response_model=List[EquipmentResponse])
async def get_equipment(
    db: Session = Depends(get_db),
    equipment_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    operator_available: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    available_only: bool = Query(True),
    limit: int = Query(50),
    offset: int = Query(0)
):
    """Get equipment with rich agricultural filters."""
    ensure_seed_data(db)
    query = db.query(Equipment)
    
    if equipment_type and equipment_type.lower() != "all":
        query = query.filter(Equipment.type == equipment_type.lower())
    
    if location and location.lower() != "all":
        query = query.filter(
            (Equipment.location.ilike(f"%{location}%")) | 
            (Equipment.district.ilike(f"%{location}%"))
        )
        
    if operator_available is not None:
        query = query.filter(Equipment.operator_available == operator_available)
        
    if search:
        query = query.filter(
            (Equipment.name.ilike(f"%{search}%")) |
            (Equipment.description.ilike(f"%{search}%")) |
            (Equipment.location.ilike(f"%{search}%"))
        )
    
    if available_only:
        query = query.filter(Equipment.is_available == True)
    
    equipment_list = query.order_by(Equipment.rating.desc()).offset(offset).limit(limit).all()
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
    current_token: TokenData = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update equipment (only by owner)."""
    user = db.query(User).filter(User.username == current_token.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    if equipment.owner_id and equipment.owner_id != user.id:
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
    current_token: TokenData = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Delete equipment (only by owner)."""
    user = db.query(User).filter(User.username == current_token.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    if equipment.owner_id and equipment.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this equipment"
        )
    
    db.delete(equipment)
    db.commit()
    
    return {"message": "Equipment deleted successfully"}

@router.post("/rentals", response_model=RentalResponse)
async def create_rental(
    rental: RentalCreate,
    current_token: Optional[TokenData] = Depends(verify_token_optional),
    db: Session = Depends(get_db)
):
    """Create a new rental booking with multi-tier pricing calculation."""
    equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    user_id = None
    renter_name = rental.renter_name or "Farmer"
    if current_token:
        user = db.query(User).filter(User.username == current_token.username).first()
        if user:
            user_id = user.id
            renter_name = user.full_name or user.username
            
    # Calculate pricing
    mode = rental.billing_mode or "day"
    units = max(float(rental.units_booked or 1.0), 0.5)
    
    base_rate = equipment.price_per_day
    if mode == "hour" and equipment.price_per_hour and equipment.price_per_hour > 0:
        base_rate = equipment.price_per_hour
    elif mode == "acre" and equipment.price_per_acre and equipment.price_per_acre > 0:
        base_rate = equipment.price_per_acre
        
    total_amount = base_rate * units
    
    # Add operator fee if selected
    if rental.with_operator and equipment.operator_fee:
        total_amount += equipment.operator_fee * (units if mode == "day" else 1.0)
        
    db_rental = Rental(
        equipment_id=rental.equipment_id,
        renter_id=user_id,
        renter_name=renter_name,
        renter_phone=rental.renter_phone or "9876543210",
        renter_location=rental.renter_location or "Farm Field",
        start_date=rental.start_date,
        end_date=rental.end_date,
        billing_mode=mode,
        units_booked=units,
        with_operator=rental.with_operator or False,
        fuel_included=rental.fuel_included or False,
        total_amount=round(total_amount, 2),
        status="pending",
        notes=rental.notes
    )
    
    db.add(db_rental)
    db.commit()
    db.refresh(db_rental)
    
    return db_rental

@router.get("/rentals", response_model=List[RentalResponse])
async def get_rentals(
    current_token: Optional[TokenData] = Depends(verify_token_optional),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None)
):
    """Get all rentals or filter by status."""
    query = db.query(Rental)
    
    if current_token:
        user = db.query(User).filter(User.username == current_token.username).first()
        if user:
            renter_rentals = db.query(Rental).filter(Rental.renter_id == user.id)
            owner_rentals = db.query(Rental).join(Equipment).filter(Equipment.owner_id == user.id)
            query = renter_rentals.union(owner_rentals)
            
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Rental.status == status_filter.lower())
        
    rentals = query.order_by(Rental.created_at.desc()).all()
    return rentals

@router.put("/rentals/{rental_id}/status")
async def update_rental_status(
    rental_id: int,
    new_status: str,
    db: Session = Depends(get_db)
):
    """Update rental lifecycle status (pending, confirmed, working, completed, cancelled)."""
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
        
    valid_statuses = ["pending", "confirmed", "working", "completed", "cancelled"]
    if new_status.lower() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    rental.status = new_status.lower()
    db.commit()
    
    return {"message": f"Rental #{rental_id} status updated to {new_status}"}

@router.get("/equipment-types")
async def get_equipment_types():
    """Get available agricultural equipment categories."""
    return {
        "types": [
            {"id": "all", "name": "All Machinery", "icon": "Grid"},
            {"id": "tractor", "name": "Tractors (45-75 HP)", "icon": "Truck"},
            {"id": "harvester", "name": "Combine Harvesters", "icon": "Wheat"},
            {"id": "drone", "name": "Spraying Drones", "icon": "Plane"},
            {"id": "tiller", "name": "Rotavators & Tillers", "icon": "Wrench"},
            {"id": "leveler", "name": "Laser Land Levelers", "icon": "SlidersHorizontal"},
            {"id": "pump", "name": "Solar & Diesel Pumps", "icon": "Droplet"}
        ]
    }

# ==========================================================
# REAL-TIME WEBRTC SIGNALING & CHAT WEBSOCKET MANAGER
# ==========================================================
from fastapi import WebSocket, WebSocketDisconnect

class EquipmentCallManager:
    def __init__(self):
        self.active_rooms: dict = {}

    async def connect(self, room: str, websocket: WebSocket):
        await websocket.accept()
        if room not in self.active_rooms:
            self.active_rooms[room] = []
        self.active_rooms[room].append(websocket)

    def disconnect(self, room: str, websocket: WebSocket):
        if room in self.active_rooms:
            if websocket in self.active_rooms[room]:
                self.active_rooms[room].remove(websocket)
            if len(self.active_rooms[room]) == 0:
                del self.active_rooms[room]

    async def broadcast(self, room: str, message: dict, sender_socket: WebSocket = None):
        if room in self.active_rooms:
            for connection in self.active_rooms[room]:
                if connection != sender_socket:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass

    async def broadcast_all(self, message: dict, sender_socket: WebSocket = None):
        for room, sockets in self.active_rooms.items():
            for connection in sockets:
                if connection != sender_socket:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass

call_manager = EquipmentCallManager()

@router.websocket("/ws/{equipment_id}")
async def equipment_realtime_ws(websocket: WebSocket, equipment_id: str):
    """Realtime WebSocket endpoint for WebRTC P2P Voice Calling & Instant Messaging."""
    room = f"eq_{equipment_id}"
    await call_manager.connect(room, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "incoming_call":
                await call_manager.broadcast_all(data, sender_socket=websocket)
            else:
                await call_manager.broadcast(room, data, sender_socket=websocket)
    except WebSocketDisconnect:
        call_manager.disconnect(room, websocket)
        await call_manager.broadcast(room, {"type": "call_ended", "reason": "peer_disconnected"})
    except Exception:
        call_manager.disconnect(room, websocket)

