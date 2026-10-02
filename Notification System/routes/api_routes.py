from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.notification import InAppNotification
from app.models.user import User

try:
    from services.email_service import email_service
    from services.otp_service import otp_service
    from services.personal_pipeline import personal_pipeline
except ImportError:
    try:
        from ..services.email_service import email_service
        from ..services.otp_service import otp_service
        from ..services.personal_pipeline import personal_pipeline
    except Exception:
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from services.email_service import email_service
        from services.otp_service import otp_service
        from services.personal_pipeline import personal_pipeline

router = APIRouter()

# -----------------------------------------------------------------------------
# PYDANTIC REQUEST SCHEMAS
# -----------------------------------------------------------------------------
class SendWelcomeRequest(BaseModel):
    email: EmailStr
    user_name: Optional[str] = "Farmer"

class SendOtpRequest(BaseModel):
    email: EmailStr
    user_name: Optional[str] = "Farmer"

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    code: str

class PersonalMessageRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    message: str
    channel: Optional[str] = "both"  # "both" | "email" | "in_app"
    priority: Optional[str] = "normal"  # "urgent" | "high" | "normal" | "low"
    category: Optional[str] = "personal"
    action_title: Optional[str] = None
    action_url: Optional[str] = None

class MandiAlertRequest(BaseModel):
    email: EmailStr
    user_name: Optional[str] = "Farmer"
    mirchi_price: Optional[str] = "₹18,500/Q"
    paddy_price: Optional[str] = "₹2,450/Q"
    cotton_price: Optional[str] = "₹7,100/Q"

class InAppCreateRequest(BaseModel):
    user_email: Optional[EmailStr] = None
    title: str
    message: str
    category: str = "general"
    priority: str = "normal"
    action_url: Optional[str] = None


# -----------------------------------------------------------------------------
# DEFAULT EMAIL TEMPLATE DISPATCHERS
# -----------------------------------------------------------------------------
@router.post("/send-welcome")
async def send_welcome_email(payload: SendWelcomeRequest, background_tasks: BackgroundTasks):
    """
    Default Template 1: Sends the responsive Welcome Tour email explaining all FarmIQ features.
    """
    background_tasks.add_task(
        email_service.send_welcome_email,
        to_email=payload.email,
        user_name=payload.user_name
    )
    return {
        "success": True,
        "message": f"Welcome tour email queued for {payload.email}",
        "recipient": payload.email,
        "template": "welcome_email_template"
    }


@router.post("/send-otp")
async def send_otp_verification(payload: SendOtpRequest, background_tasks: BackgroundTasks):
    """
    Default Template 2: Generates a secure 6-digit OTP and sends the official branded
    verification email from farmiq.in@gmail.com with 10-minute validity.
    """
    code = otp_service.generate_otp(payload.email)
    background_tasks.add_task(
        email_service.send_otp_email,
        to_email=payload.email,
        otp_code=code,
        user_name=payload.user_name
    )
    return {
        "success": True,
        "message": f"6-digit verification code sent to {payload.email}",
        "recipient": payload.email,
        "valid_for_seconds": 600
    }


@router.post("/verify-otp")
async def verify_otp_code(payload: VerifyOtpRequest):
    """
    Validates the 6-digit code submitted by the user.
    """
    is_valid, msg = otp_service.verify_otp(payload.email, payload.code)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
    return {
        "success": True,
        "message": "OTP verification successful",
        "email": payload.email
    }


@router.post("/send-mandi-alert")
async def send_mandi_alert(payload: MandiAlertRequest, background_tasks: BackgroundTasks):
    """
    Sends the Daily Mandi Price Ticker email (Guntur Mirchi, Tenali Paddy, Warangal Cotton).
    """
    mandi_data = {
        "mirchi_price": payload.mirchi_price,
        "paddy_price": payload.paddy_price,
        "cotton_price": payload.cotton_price
    }
    background_tasks.add_task(
        email_service.send_mandi_price_email,
        to_email=payload.email,
        user_name=payload.user_name,
        mandi_data=mandi_data
    )
    return {
        "success": True,
        "message": f"Mandi price ticker queued for {payload.email}"
    }


# -----------------------------------------------------------------------------
# PERSONAL MESSAGING PIPELINE (ADMIN TARGETED DISPATCH)
# -----------------------------------------------------------------------------
@router.post("/personal-message")
async def send_personal_message(payload: PersonalMessageRequest, background_tasks: BackgroundTasks):
    """
    Dispatches a custom, targeted message to a single user via Email and/or In-App Bell drawer.
    """
    background_tasks.add_task(
        personal_pipeline.dispatch_message,
        recipient_email=payload.recipient_email,
        subject=payload.subject,
        message=payload.message,
        channel=payload.channel,
        priority=payload.priority,
        category=payload.category,
        action_title=payload.action_title,
        action_url=payload.action_url
    )
    return {
        "success": True,
        "message": f"Personal message queued for {payload.recipient_email} across channel '{payload.channel}'",
        "recipient": payload.recipient_email,
        "subject": payload.subject
    }


# -----------------------------------------------------------------------------
# IN-APP BELL NOTIFICATION INBOX (UI HEADER BELL SYSTEM)
# -----------------------------------------------------------------------------
@router.get("/inbox")
async def get_inbox_notifications(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns recent in-app notifications for the UI Header Bell drawer.
    """
    query = db.query(InAppNotification)
    if user_email:
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            query = query.filter((InAppNotification.user_id == user.id) | (InAppNotification.user_id == None))
    
    notifications = query.order_by(InAppNotification.created_at.desc()).limit(40).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "category": n.category,
            "priority": n.priority,
            "action_url": n.action_url,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifications
    ]


@router.post("/inbox/create")
async def create_inbox_notification(payload: InAppCreateRequest, db: Session = Depends(get_db)):
    """
    Adds a new notification into the UI Header Bell inbox.
    """
    user_id = None
    if payload.user_email:
        user = db.query(User).filter(User.email == payload.user_email).first()
        if user:
            user_id = user.id

    item = InAppNotification(
        user_id=user_id,
        title=payload.title,
        message=payload.message,
        category=payload.category,
        priority=payload.priority,
        action_url=payload.action_url,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"success": True, "id": item.id}


@router.put("/inbox/{notification_id}/read")
async def mark_inbox_read(notification_id: int, db: Session = Depends(get_db)):
    """
    Marks an in-app notification as read.
    """
    n = db.query(InAppNotification).filter(InAppNotification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"success": True, "id": notification_id}


@router.put("/inbox/read-all")
async def mark_all_inbox_read(db: Session = Depends(get_db)):
    """
    Marks all notifications in the inbox as read.
    """
    db.query(InAppNotification).update({InAppNotification.is_read: True})
    db.commit()
    return {"success": True, "message": "All notifications marked as read"}


@router.delete("/inbox/clear")
async def clear_inbox(db: Session = Depends(get_db)):
    """
    Clears notifications from the inbox.
    """
    db.query(InAppNotification).delete()
    db.commit()
    return {"success": True, "message": "Inbox cleared"}
