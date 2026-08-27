import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from app.core.config import settings
import os

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        # SMTP Settings (can be Gmail, Resend, or Sendgrid free tiers)
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.sender_email = os.getenv("SENDER_EMAIL", "alerts@farmiq-agrovision.org")

    def send_email_alert(self, to_email: str, subject: str, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send formatted HTML weather advisory / warning email to farmer."""
        location_name = alert_data.get("location", "Your Farm")
        alert_title = alert_data.get("title", "Daily Field Advisory")
        alert_msg = alert_data.get("message", "Check field recommendations below.")
        irrig_text = alert_data.get("irrigation", "Maintain standard irrigation schedule.")
        spray_text = alert_data.get("spraying", "Favorable conditions for morning spraying.")
        plant_text = alert_data.get("planting", "Conditions optimal for field activities.")

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }}
                .card {{ max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
                .header {{ background: #16a34a; color: white; padding: 24px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .content {{ padding: 24px; color: #334155; }}
                .alert-box {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin-bottom: 20px; }}
                .advisory-item {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 12px; }}
                .advisory-title {{ font-weight: bold; color: #0f172a; margin-bottom: 4px; }}
                .footer {{ text-align: center; padding: 16px; color: #94a3b8; font-size: 12px; background: #f8fafc; }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <h1>🌾 FarmIQ Agro-Weather Advisory</h1>
                    <p style="margin: 4px 0 0 0; opacity: 0.9;">Real-Time Field Recommendations</p>
                </div>
                <div class="content">
                    <p>Dear Farmer,</p>
                    <p>Here is your microclimate update for <strong>{location_name}</strong>:</p>
                    
                    <div class="alert-box">
                        <strong style="color: #b91c1c;">⚠️ {alert_title}</strong>
                        <p style="margin: 6px 0 0 0; color: #7f1d1d;">{alert_msg}</p>
                    </div>

                    <div class="advisory-item">
                        <div class="advisory-title">💧 Irrigation Recommendation</div>
                        <div>{irrig_text}</div>
                    </div>

                    <div class="advisory-item">
                        <div class="advisory-title">🚜 Chemical & Foliar Spraying</div>
                        <div>{spray_text}</div>
                    </div>

                    <div class="advisory-item">
                        <div class="advisory-title">🌱 Sowing & Field Work</div>
                        <div>{plant_text}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>FarmIQ Agro-VisionAI • Automated Precision Agriculture Service</p>
                </div>
            </div>
        </body>
        </html>
        """

        try:
            if self.smtp_user and self.smtp_password:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = self.sender_email
                msg["To"] = to_email
                msg.attach(MIMEText(html_content, "html"))

                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.sender_email, to_email, msg.as_string())
                
                logger.info(f"Email successfully sent to {to_email}")
                return {"success": True, "status": "sent", "recipient": to_email}
            else:
                # Simulated dispatch mode if SMTP credentials are pending
                logger.info(f"[Simulated Dispatch] Email generated for {to_email}: {subject}")
                return {
                    "success": True, 
                    "status": "simulated_success", 
                    "message": "Email template generated and validated successfully (Configure SMTP_USER in .env for live inbox delivery)",
                    "recipient": to_email,
                    "preview_html": html_content
                }
        except Exception as e:
            logger.error(f"Error sending email alert: {e}")
            return {"success": False, "error": str(e)}

    def format_voice_script(self, location: str, advisories: Dict[str, Any], lang: str = "en") -> str:
        """Generates clear, natural spoken-audio scripts for Text-to-Speech (TTS) / Voice IVR."""
        curr = advisories.get("current_climate", {})
        temp = curr.get("temperature", 28)
        adv = advisories.get("advisories", {})
        
        irrig = adv.get("irrigation", {}).get("advisory", "Normal irrigation.")
        spray = adv.get("spraying", {}).get("advisory", "Safe to spray.")
        
        if lang.startswith("hi"):  # Hindi
            return f"नमस्ते किसान भाई. {location} में आज का तापमान {temp} डिग्री सेल्सियस है. सिंचाई सलाह: {irrig}. छिड़काव सलाह: {spray}."
        elif lang.startswith("te"): # Telugu
            return f"నమస్కారం రైతు మిత్రులారా. {location} లో నేటి ఉష్ణోగ్రత {temp} డిగ్రీలు. నీటి పారుదల సలహా: {irrig}. పిచికారీ సలహా: {spray}."
        else: # English
            return f"Hello farmer. In {location}, today's temperature is {temp} degrees Celsius. Irrigation advice: {irrig}. Spraying advice: {spray}."


notification_service = NotificationService()
