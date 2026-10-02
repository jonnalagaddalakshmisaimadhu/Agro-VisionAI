from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.notification import UserDevice, InAppNotification, NotificationPreference
from app.models.user import User
from app.services.notification_service import notification_service
from app.services.email_templates import (
    build_google_onboarding_template,
    build_existing_user_announcement_template,
    build_critical_alert_template
)

router = APIRouter()

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------
class EmailRequest(BaseModel):
    email: EmailStr
    subject: str
    message: str
    html_body: Optional[str] = None

class PushNotificationRequest(BaseModel):
    token: str
    title: str
    body: str
    data: Optional[Dict[str, str]] = None

class TopicNotificationRequest(BaseModel):
    topic: str
    title: str
    body: str
    data: Optional[Dict[str, str]] = None

class DeviceRegisterRequest(BaseModel):
    fcm_token: str
    device_type: str = "web"  # "android", "ios", "web"
    user_email: Optional[EmailStr] = None

class InAppCreateRequest(BaseModel):
    user_email: Optional[EmailStr] = None
    title: str
    message: str
    category: str = "general"
    priority: str = "normal"
    action_url: Optional[str] = None

class GoogleOnboardingRequest(BaseModel):
    user_name: str = "Farmer"
    email: EmailStr

class AnnouncementBroadcastRequest(BaseModel):
    target_email: Optional[EmailStr] = None

class PreferencesUpdateRequest(BaseModel):
    user_email: EmailStr
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    weather_alerts: Optional[bool] = None
    disease_alerts: Optional[bool] = None
    market_arbitrage_alerts: Optional[bool] = None
    route_traffic_alerts: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None
    preferred_language: Optional[str] = None


# -----------------------------------------------------------------------------
# CORE ENDPOINTS
# -----------------------------------------------------------------------------
@router.get("/status")
async def get_notification_system_status():
    """Returns the operational status of Email (Gmail SMTP) and Push (Firebase FCM) notification pipelines."""
    smtp_ready = bool(notification_service.smtp_user and notification_service.smtp_password)
    from app.services.notification_service import _firebase_initialized
    
    return {
        "status": "online",
        "email_service": {
            "provider": "Gmail SMTP",
            "sender_email": notification_service.sender_email,
            "is_configured": smtp_ready
        },
        "push_service": {
            "provider": "Firebase Cloud Messaging (FCM)",
            "is_initialized": _firebase_initialized,
            "project_id": "farmiq-agrovisionai" if _firebase_initialized else None
        }
    }


# -----------------------------------------------------------------------------
# DEVICE TOKEN VAULT (FCM Push Registration)
# -----------------------------------------------------------------------------
@router.post("/devices/register")
async def register_device(payload: DeviceRegisterRequest, db: Session = Depends(get_db)):
    """Registers or refreshes an FCM device push token for a user."""
    user = None
    if payload.user_email:
        user = db.query(User).filter(User.email == payload.user_email).first()

    device = db.query(UserDevice).filter(UserDevice.fcm_token == payload.fcm_token).first()
    if device:
        device.is_active = True
        device.device_type = payload.device_type
        if user:
            device.user_id = user.id
        device.updated_at = datetime.utcnow()
    else:
        device = UserDevice(
            fcm_token=payload.fcm_token,
            device_type=payload.device_type,
            user_id=user.id if user else None,
            is_active=True
        )
        db.add(device)

    db.commit()
    db.refresh(device)
    return {"success": True, "message": "Device token registered successfully", "device_id": device.id}


# -----------------------------------------------------------------------------
# IN-APP NOTIFICATION BELL INBOX (Persistent User Notifications)
# -----------------------------------------------------------------------------
@router.get("/inbox")
async def get_in_app_notifications(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns recent in-app notifications for the user's bell notification drawer."""
    query = db.query(InAppNotification)
    if user_email:
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            query = query.filter((InAppNotification.user_id == user.id) | (InAppNotification.user_id == None))
    
    notifications = query.order_by(InAppNotification.created_at.desc()).limit(30).all()
    
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


@router.put("/inbox/{notification_id}/read")
async def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """Marks a specific in-app notification as read."""
    n = db.query(InAppNotification).filter(InAppNotification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"success": True, "message": f"Notification {notification_id} marked as read"}


@router.post("/inbox/create")
async def create_in_app_notification(payload: InAppCreateRequest, db: Session = Depends(get_db)):
    """Creates a persistent notification inside the in-app bell drawer."""
    user = None
    if payload.user_email:
        user = db.query(User).filter(User.email == payload.user_email).first()

    n = InAppNotification(
        user_id=user.id if user else None,
        title=payload.title,
        message=payload.message,
        category=payload.category,
        priority=payload.priority,
        action_url=payload.action_url,
        is_read=False
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"success": True, "notification_id": n.id}


# -----------------------------------------------------------------------------
# NOTIFICATION PREFERENCES & QUIET HOURS
# -----------------------------------------------------------------------------
@router.get("/preferences")
async def get_user_preferences(user_email: str, db: Session = Depends(get_db)):
    """Fetches user alert toggles and quiet hours settings."""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        return {"email_enabled": True, "push_enabled": True, "weather_alerts": True, "disease_alerts": True, "quiet_hours_enabled": True}
    
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == user.id).first()
    if not pref:
        pref = NotificationPreference(user_id=user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return {
        "email_enabled": pref.email_enabled,
        "push_enabled": pref.push_enabled,
        "weather_alerts": pref.weather_alerts,
        "disease_alerts": pref.disease_alerts,
        "market_arbitrage_alerts": pref.market_arbitrage_alerts,
        "route_traffic_alerts": pref.route_traffic_alerts,
        "quiet_hours_enabled": pref.quiet_hours_enabled,
        "quiet_hours_start": pref.quiet_hours_start,
        "quiet_hours_end": pref.quiet_hours_end,
        "preferred_language": pref.preferred_language
    }


# -----------------------------------------------------------------------------
# DEDICATED TEMPLATE ONBOARDING & ANNOUNCEMENT DISPATCHERS (NON-BLOCKING ASYNC)
# -----------------------------------------------------------------------------
@router.post("/onboarding/google")
async def trigger_google_onboarding_email(payload: GoogleOnboardingRequest, background_tasks: BackgroundTasks):
    """
    Template 1: Dispatches the comprehensive Google Authentication Onboarding Email
    with all 6 core FarmIQ features (asynchronously in the background).
    """
    template = build_google_onboarding_template(user_name=payload.user_name, user_email=payload.email)
    
    background_tasks.add_task(
        notification_service.send_custom_email,
        to_email=payload.email,
        subject=template["subject"],
        message=f"Welcome to FarmIQ, {payload.user_name}. Your precision agriculture platform is active.",
        html_body=template["html"]
    )
    
    return {
        "success": True,
        "status": "queued_async",
        "recipient": payload.email,
        "template": "google_auth_welcome_all_features"
    }


@router.post("/announcement/broadcast")
async def broadcast_system_announcement(payload: AnnouncementBroadcastRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Template 2: Sends the 'Thank You from FarmIQ Team' notification system go-live
    announcement to existing Google authenticated users.
    """
    # If specific recipient is provided, send only to them
    if payload.target_email:
        user = db.query(User).filter(User.email == payload.target_email).first()
        u_name = user.full_name if (user and user.full_name) else payload.target_email.split("@")[0].capitalize()
        template = build_existing_user_announcement_template(user_name=u_name, user_email=payload.target_email)
        
        background_tasks.add_task(
            notification_service.send_custom_email,
            to_email=payload.target_email,
            subject=template["subject"],
            message="Thank You from the FarmIQ Team — Your Real-Time Notification System is Now Live",
            html_body=template["html"]
        )
        recipients_count = 1
    else:
        # Broadcast to all registered users, dynamically injecting each user's own name and email
        users = db.query(User).filter(User.email.isnot(None)).all()
        recipients_count = 0
        for u in users:
            u_name = u.full_name or u.username
            u_email = u.email
            template = build_existing_user_announcement_template(user_name=u_name, user_email=u_email)
            background_tasks.add_task(
                notification_service.send_custom_email,
                to_email=u_email,
                subject=template["subject"],
                message="Thank You from the FarmIQ Team — Your Real-Time Notification System is Now Live",
                html_body=template["html"]
            )
            recipients_count += 1


    # Record inside in-app notification center as well
    in_app = InAppNotification(
        title="🔔 Notification System Active",
        message="High-speed FCM push & email dispatch is now active for your account. Thank you from the FarmIQ Team!",
        category="system",
        priority="normal",
        is_read=False
    )
    db.add(in_app)
    db.commit()

    return {
        "success": True,
        "status": "queued_async",
        "recipients_count": recipients_count,
        "target_email": payload.target_email,
        "template": "existing_users_appreciation_and_announcement"
    }


# -----------------------------------------------------------------------------
# RAW EMAIL & PUSH DISPATCH ENDPOINTS
# -----------------------------------------------------------------------------
@router.post("/send-email")
async def send_email(payload: EmailRequest, background_tasks: BackgroundTasks):
    """Dispatches a real email to a recipient using farmiq.in@gmail.com in the background."""
    background_tasks.add_task(
        notification_service.send_custom_email,
        to_email=payload.email,
        subject=payload.subject,
        message=payload.message,
        html_body=payload.html_body
    )
    return {"success": True, "status": "queued_for_delivery", "recipient": payload.email}


@router.post("/send-push")
async def send_push_notification(payload: PushNotificationRequest):
    """Sends a native FCM push notification directly to a device token."""
    result = notification_service.send_push_notification(
        token=payload.token,
        title=payload.title,
        body=payload.body,
        data=payload.data
    )
    return result


@router.post("/send-topic")
async def broadcast_topic_notification(payload: TopicNotificationRequest):
    """Broadcasts a push notification to all devices subscribed to a topic (e.g. 'all_users', 'weather_alerts')."""
    result = notification_service.send_topic_notification(
        topic=payload.topic,
        title=payload.title,
        body=payload.body,
        data=payload.data
    )
    return result
