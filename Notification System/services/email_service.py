import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from Backend/.env and workspace root
_current_dir = Path(__file__).resolve().parent
_project_root = _current_dir.parent.parent
load_dotenv(_project_root / "Backend" / ".env")
load_dotenv(_project_root / ".env")
load_dotenv(_current_dir.parent / ".env")
load_dotenv()

logger = logging.getLogger("NotificationSystem.EmailService")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

# Templates directory
TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

class EmailService:
    def __init__(self):
        self._refresh_credentials()

    def _refresh_credentials(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_USER", "farmiq.in@gmail.com")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
        self.sender_email = os.getenv("SENDER_EMAIL", self.smtp_user)

    def _read_template(self, filename: str) -> str:
        filepath = TEMPLATES_DIR / filename
        if not filepath.exists():
            raise FileNotFoundError(f"Email template not found: {filepath}")
        return filepath.read_text(encoding="utf-8")

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> Dict[str, Any]:
        """Dispatches an email via Gmail SMTP with TLS."""
        self._refresh_credentials()
        try:
            if not self.smtp_user or not self.smtp_password:
                logger.warning(f"[Simulated Dispatch] Email to {to_email}: {subject}")
                return {
                    "success": True,
                    "simulated": True,
                    "recipient": to_email,
                    "message": "SMTP credentials not provided; simulated successfully."
                }

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"FarmIQ Agro-VisionAI <{self.sender_email}>"
            msg["To"] = to_email

            if text_body:
                msg.attach(MIMEText(text_body, "plain", "utf-8"))
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=20) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.sender_email, [to_email], msg.as_string())

            logger.info(f"Email successfully delivered to {to_email} (Subject: {subject})")
            return {
                "success": True,
                "simulated": False,
                "recipient": to_email,
                "sender": self.sender_email
            }
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return {"success": False, "error": str(e), "recipient": to_email}

    def send_welcome_email(self, to_email: str, user_name: str = "Farmer") -> Dict[str, Any]:
        """Renders and sends the full FarmIQ feature tour welcome email."""
        raw_html = self._read_template("welcome_email_template.html")
        rendered_html = (
            raw_html
            .replace("{{ user_name }}", user_name)
            .replace("{{ user_email }}", to_email)
        )
        subject = f"🌾 Welcome to FarmIQ, {user_name}! Your Smart Farming AI Platform is Ready"
        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_body=rendered_html,
            text_body=f"Welcome to FarmIQ, {user_name}! Explore your precision agriculture dashboard at https://farmiq-agrovisionai.web.app"
        )

    def send_otp_email(self, to_email: str, otp_code: str, user_name: str = "Farmer") -> Dict[str, Any]:
        """Renders and sends the official FarmIQ 6-digit OTP verification email."""
        raw_html = self._read_template("otp_verification_template.html")
        rendered_html = (
            raw_html
            .replace("{{ user_name }}", user_name)
            .replace("{{ user_email }}", to_email)
            .replace("{{ otp_code }}", otp_code)
        )
        subject = f"🔐 Your FarmIQ Verification Code: {otp_code}"
        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_body=rendered_html,
            text_body=f"Your FarmIQ verification code is {otp_code}. Valid for 10 minutes. Do not share this code."
        )

    def send_mandi_price_email(
        self,
        to_email: str,
        user_name: str = "Farmer",
        mandi_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Renders and sends the daily Mandi price ticker email."""
        raw_html = self._read_template("mandi_price_ticker_template.html")
        data = mandi_data or {
            "mirchi_price": "₹18,500/Q",
            "paddy_price": "₹2,450/Q",
            "cotton_price": "₹7,100/Q",
            "date": "Today"
        }
        rendered_html = (
            raw_html
            .replace("{{ user_name }}", user_name)
            .replace("{{ user_email }}", to_email)
            .replace("{{ mirchi_price }}", str(data.get("mirchi_price", "₹18,500/Q")))
            .replace("{{ paddy_price }}", str(data.get("paddy_price", "₹2,450/Q")))
            .replace("{{ cotton_price }}", str(data.get("cotton_price", "₹7,100/Q")))
        )
        subject = f"📊 Daily Mandi Price Ticker: Guntur Mirchi, Tenali Paddy & Warangal Cotton"
        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_body=rendered_html
        )

# Global singleton
email_service = EmailService()
