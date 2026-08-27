from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models.marketplace import Product
from app.models.marketplace_chat import MarketplaceMessage
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room: str, websocket: WebSocket):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)
        logger.info(f"Client connected to room {room}. Total: {len(self.active_connections[room])}")

    def disconnect(self, room: str, websocket: WebSocket):
        if room in self.active_connections:
            if websocket in self.active_connections[room]:
                self.active_connections[room].remove(websocket)
            if len(self.active_connections[room]) == 0:
                del self.active_connections[room]

    async def broadcast(self, room: str, message: dict):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to client in {room}: {e}")

manager = ConnectionManager()


class SendMessageRequest(BaseModel):
    sender_name: str = "Buyer"
    receiver_name: Optional[str] = "Farmer"
    message_text: str
    is_offer: bool = False
    offered_price: Optional[float] = None
    offered_quantity: Optional[float] = None


@router.get("/inbox")
async def get_seller_inbox(db: Session = Depends(get_db)):
    """Get all active conversation threads and buyer inquiries grouped by product."""
    products = db.query(Product).all()
    inbox = []
    
    for prod in products:
        last_msg = db.query(MarketplaceMessage).filter(
            MarketplaceMessage.product_id == prod.id
        ).order_by(MarketplaceMessage.created_at.desc()).first()
        
        msg_count = db.query(MarketplaceMessage).filter(
            MarketplaceMessage.product_id == prod.id
        ).count()
        
        if last_msg:
            inbox.append({
                "product_id": prod.id,
                "product_name": prod.name,
                "category": prod.category,
                "price_per_unit": prod.price_per_unit,
                "unit": prod.unit,
                "stock_quantity": prod.stock_quantity,
                "seller_name": prod.seller_name,
                "location": prod.location,
                "image_url": prod.image_url,
                "phone_number": prod.phone_number,
                "last_message": last_msg.message_text,
                "last_sender": last_msg.sender_name,
                "is_offer": last_msg.is_offer,
                "offered_price": last_msg.offered_price,
                "offered_quantity": last_msg.offered_quantity,
                "offer_status": last_msg.offer_status,
                "last_activity": last_msg.created_at.isoformat() if last_msg.created_at else None,
                "total_messages": msg_count
            })
            
    inbox.sort(key=lambda x: x["last_activity"] or "", reverse=True)
    return inbox


@router.get("/chat/{product_id}")
async def get_chat_history(product_id: int, db: Session = Depends(get_db)):

    """Retrieve chat history for a marketplace product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    messages = db.query(MarketplaceMessage).filter(
        MarketplaceMessage.product_id == product_id
    ).order_by(MarketplaceMessage.created_at.asc()).all()

    # If new chat, seed a welcoming farmer message
    if len(messages) == 0:
        welcome_msg = MarketplaceMessage(
            product_id=product_id,
            sender_name=product.seller_name or "Farmer",
            receiver_name="Buyer",
            message_text=f"Namaste! I have {product.stock_quantity} {product.unit} of {product.name} available at ₹{product.price_per_unit}/{product.unit}. Let me know if you need a sample or want to discuss transport/rates.",
            is_offer=False
        )
        db.add(welcome_msg)
        db.commit()
        db.refresh(welcome_msg)
        messages = [welcome_msg]

    return [
        {
            "id": m.id,
            "product_id": m.product_id,
            "sender_name": m.sender_name,
            "receiver_name": m.receiver_name,
            "message_text": m.message_text,
            "is_offer": m.is_offer,
            "offered_price": m.offered_price,
            "offered_quantity": m.offered_quantity,
            "offer_status": m.offer_status,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]


@router.post("/chat/{product_id}")
async def send_chat_message(
    product_id: int,
    req: SendMessageRequest,
    db: Session = Depends(get_db)
):
    """Post a new message or price offer and broadcast via WebSockets."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_msg = MarketplaceMessage(
        product_id=product_id,
        sender_name=req.sender_name,
        receiver_name=req.receiver_name or product.seller_name,
        message_text=req.message_text,
        is_offer=req.is_offer,
        offered_price=req.offered_price,
        offered_quantity=req.offered_quantity,
        offer_status="pending" if req.is_offer else "standard"
    )

    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    msg_dict = {
        "id": new_msg.id,
        "product_id": new_msg.product_id,
        "sender_name": new_msg.sender_name,
        "receiver_name": new_msg.receiver_name,
        "message_text": new_msg.message_text,
        "is_offer": new_msg.is_offer,
        "offered_price": new_msg.offered_price,
        "offered_quantity": new_msg.offered_quantity,
        "offer_status": new_msg.offer_status,
        "created_at": new_msg.created_at.isoformat()
    }

    # Broadcast to all connected clients in this product room
    await manager.broadcast(f"chat_{product_id}", {"type": "chat_message", "data": msg_dict})

    return msg_dict


# WebSocket for Live Real-Time Messaging & Typing
@router.websocket("/ws/chat/{product_id}")
async def websocket_chat_endpoint(websocket: WebSocket, product_id: int):
    room = f"chat_{product_id}"
    await manager.connect(room, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Echo or broadcast signaling / typing state
            await manager.broadcast(room, data)
    except WebSocketDisconnect:
        manager.disconnect(room, websocket)
    except Exception as e:
        logger.error(f"WebSocket error in {room}: {e}")
        manager.disconnect(room, websocket)


# WebSocket for Free WebRTC Audio Call Signaling (P2P audio)
@router.websocket("/ws/call/{room_id}")
async def websocket_call_endpoint(websocket: WebSocket, room_id: str):
    room = f"call_{room_id}"
    await manager.connect(room, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast WebRTC Offer, Answer, ICE candidates to peer
            await manager.broadcast(room, data)
    except WebSocketDisconnect:
        manager.disconnect(room, websocket)
    except Exception as e:
        logger.error(f"Call signaling error in {room}: {e}")
        manager.disconnect(room, websocket)
