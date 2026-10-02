import sys
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path

# Ensure Backend package is discoverable
_backend_path = Path(__file__).resolve().parent.parent.parent / "Backend"
if str(_backend_path) not in sys.path:
    sys.path.insert(0, str(_backend_path))

try:
    from app.database import SessionLocal, engine, Base
    from app.models.notification import InAppNotification
    from app.models.user import User
    if engine and Base:
        Base.metadata.create_all(bind=engine)
except ImportError:
    SessionLocal = None
    InAppNotification = None
    User = None
try:
    from .email_service import email_service
except ImportError:
    try:
        from services.email_service import email_service
    except Exception:
        from email_service import email_service

logger = logging.getLogger("NotificationSystem.PersonalPipeline")

PERSONAL_EMAIL_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .header { background: linear-gradient(135deg, #15803d, #166534); padding: 28px; color: #ffffff; text-align: left; }
  .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .title { font-size: 20px; font-weight: 700; margin: 0; }
  .body { padding: 32px 28px; font-size: 15px; line-height: 1.6; color: #334155; }
  .priority-urgent { border-left: 4px solid #ef4444; background: #fef2f2; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: 600; color: #991b1b; }
  .priority-high { border-left: 4px solid #f59e0b; background: #fffbeb; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: 600; color: #92400e; }
  .btn-container { text-align: center; margin-top: 28px; }
  .btn { display: inline-block; background: #16a34a; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(22,163,74,0.3); }
  .footer { background: #f8fafc; padding: 20px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="badge">Direct FarmIQ Advisory</div>
    <h1 class="title">{{ subject }}</h1>
  </div>
  <div class="body">
    {{ priority_banner }}
    <p>Namaste <strong>{{ recipient_name }}</strong>,</p>
    <div>{{ formatted_message }}</div>
    {{ action_button }}
  </div>
  <div class="footer">
    <p>FarmIQ Agro-VisionAI • Direct Farmer Advisory Dispatch</p>
    <p style="margin: 0; font-size: 11px;">Sent from farmiq.in@gmail.com to {{ recipient_email }}</p>
  </div>
</div>
</body>
</html>"""

class PersonalPipeline:
    """
    Dedicated Personal Messaging Pipeline:
    Allows administrators or automated services to dispatch tailored, targeted 
    messages to specific users via Email, In-App Bell drawer, or both channels.
    """

    def dispatch_message(
        self,
        recipient_email: str,
        subject: str,
        message: str,
        channel: str = "both",  # "email" | "in_app" | "both"
        priority: str = "normal",  # "urgent" | "high" | "normal" | "low"
        category: str = "personal",
        action_title: Optional[str] = None,
        action_url: Optional[str] = None,
        sender_name: str = "FarmIQ Team"
    ) -> Dict[str, Any]:
        """
        Dispatches targeted personal notification to a single user.
        """
        db = SessionLocal()
        user_name = "Farmer"
        user_id = None
        
        try:
            user = db.query(User).filter(User.email == recipient_email.strip().lower()).first()
            if user:
                user_name = user.full_name or user.username or user_name
                user_id = user.id
        except Exception as e:
            logger.warning(f"Could not query user table: {e}")
        finally:
            db.close()

        results = {
            "recipient_email": recipient_email,
            "recipient_name": user_name,
            "channel": channel,
            "subject": subject,
            "timestamp": datetime.utcnow().isoformat(),
            "email_status": None,
            "in_app_status": None
        }

        # 1. In-App Bell Center Delivery
        if channel in ["in_app", "both"]:
            db = SessionLocal()
            try:
                # Add priority emoji prefix to title if urgent
                display_title = subject
                if priority == "urgent":
                    display_title = f"🚨 {subject}"
                elif priority == "high":
                    display_title = f"⚠️ {subject}"
                else:
                    display_title = f"📩 {subject}"

                notification = InAppNotification(
                    user_id=user_id,
                    title=display_title,
                    message=message,
                    category=category,
                    priority=priority,
                    action_url=action_url,
                    is_read=False,
                    created_at=datetime.utcnow()
                )
                db.add(notification)
                db.commit()
                db.refresh(notification)
                results["in_app_status"] = {
                    "success": True,
                    "notification_id": notification.id
                }
                logger.info(f"In-App notification #{notification.id} delivered for {recipient_email}")
            except Exception as e:
                logger.error(f"In-App dispatch failed for {recipient_email}: {e}")
                results["in_app_status"] = {"success": False, "error": str(e)}
            finally:
                db.close()

        # 2. Email Delivery
        if channel in ["email", "both"]:
            try:
                priority_banner = ""
                if priority == "urgent":
                    priority_banner = '<div class="priority-urgent">🚨 URGENT NOTICE: High priority farm advisory</div>'
                elif priority == "high":
                    priority_banner = '<div class="priority-high">⚠️ TIME SENSITIVE: Important advisory</div>'

                action_button = ""
                if action_title and action_url:
                    action_button = f'<div class="btn-container"><a href="{action_url}" class="btn">{action_title}</a></div>'

                # Convert line breaks to paragraphs
                paragraphs = "".join([f"<p>{p.strip()}</p>" for p in message.split("\n") if p.strip()])
                
                rendered_html = (
                    PERSONAL_EMAIL_TEMPLATE
                    .replace("{{ subject }}", subject)
                    .replace("{{ recipient_name }}", user_name)
                    .replace("{{ recipient_email }}", recipient_email)
                    .replace("{{ priority_banner }}", priority_banner)
                    .replace("{{ formatted_message }}", paragraphs)
                    .replace("{{ action_button }}", action_button)
                )

                email_res = email_service.send_email(
                    to_email=recipient_email,
                    subject=f"FarmIQ Advisory: {subject}",
                    html_body=rendered_html,
                    text_body=f"Namaste {user_name},\n\n{message}\n\nFarmIQ Agro-VisionAI"
                )
                results["email_status"] = email_res
            except Exception as e:
                logger.error(f"Email dispatch failed for {recipient_email}: {e}")
                results["email_status"] = {"success": False, "error": str(e)}

        return results

# Singleton instance
personal_pipeline = PersonalPipeline()
