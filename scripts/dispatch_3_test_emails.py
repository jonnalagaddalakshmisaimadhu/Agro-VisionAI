import smtplib
import os
import sys
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv

# Ensure Backend path is in sys.path
backend_dir = Path(__file__).resolve().parent.parent / "Backend"
sys.path.insert(0, str(backend_dir))

load_dotenv(backend_dir / ".env")

from app.services.email_templates import (
    build_google_onboarding_template,
    build_existing_user_announcement_template,
    build_critical_alert_template
)

smtp_user = os.getenv("SMTP_USER", "farmiq.in@gmail.com")
smtp_pass = os.getenv("SMTP_PASSWORD")
recipient = "jlakshmisaimadhu@gmail.com"
user_name = "Madhu"

print(f"==================================================")
print(f"DISPATCHING 3 BESPOKE TEST EMAILS TO: {recipient}")
print(f"FROM: {smtp_user}")
print(f"==================================================")

# -----------------------------------------------------------------------------
# EMAIL 1: New User Google Auth Onboarding (All 6 Features)
# -----------------------------------------------------------------------------
print("\n[1/3] Generating Email 1: Google Auth New User Onboarding (All Features)...")
t1 = build_google_onboarding_template(user_name=user_name, user_email=recipient)

msg1 = MIMEMultipart("alternative")
msg1["Subject"] = t1["subject"]
msg1["From"] = f"FarmIQ Team <{smtp_user}>"
msg1["To"] = recipient
msg1.attach(MIMEText("Welcome to FarmIQ. Please view in HTML client.", "plain"))
msg1.attach(MIMEText(t1["html"], "html"))

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login(smtp_user, smtp_pass)
    server.sendmail(smtp_user, recipient, msg1.as_string())
print("[OK] EMAIL 1 SENT: Google Auth Onboarding Welcome with All Features!")

time.sleep(2)  # Brief pause between dispatches

# -----------------------------------------------------------------------------
# EMAIL 2: Existing User Announcement ("Thank you from FarmIQ Team")
# -----------------------------------------------------------------------------
print("\n[2/3] Generating Email 2: Existing Users Appreciation & System Activation...")
t2 = build_existing_user_announcement_template(user_name=user_name, user_email=recipient)

msg2 = MIMEMultipart("alternative")
msg2["Subject"] = t2["subject"]
msg2["From"] = f"FarmIQ Team <{smtp_user}>"
msg2["To"] = recipient
msg2.attach(MIMEText("Thank you from FarmIQ Team. Please view in HTML client.", "plain"))
msg2.attach(MIMEText(t2["html"], "html"))

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login(smtp_user, smtp_pass)
    server.sendmail(smtp_user, recipient, msg2.as_string())
print("[OK] EMAIL 2 SENT: Thank You from FarmIQ Team System Activation Announcement!")

time.sleep(2)

# -----------------------------------------------------------------------------
# EMAIL 3: Critical Real-Time Alert & In-App Sync Notice
# -----------------------------------------------------------------------------
print("\n[3/3] Generating Email 3: Critical Operational Event & Security Alert...")
t3 = build_critical_alert_template(
    user_name=user_name,
    alert_title="Precipitation Spike & Sudden Microclimate Drop Detected",
    alert_type="Automated Field Hazard Warning",
    alert_details="Radar sensors detected rapid cloud condensation over Guntur plot sector 4. 88% chance of downpour within 90 minutes. Barometric pressure dropped by 4.2 hPa. Chemical application should be halted immediately.",
    action_label="Review Field Radar & Safe Window",
    action_url="https://farmiq-agrovisionai.web.app"
)

msg3 = MIMEMultipart("alternative")
msg3["Subject"] = t3["subject"]
msg3["From"] = f"FarmIQ Alert Engine <{smtp_user}>"
msg3["To"] = recipient
msg3.attach(MIMEText("Critical Notice from FarmIQ. Please view in HTML client.", "plain"))
msg3.attach(MIMEText(t3["html"], "html"))

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login(smtp_user, smtp_pass)
    server.sendmail(smtp_user, recipient, msg3.as_string())
print("[OK] EMAIL 3 SENT: Critical Operational & In-App Sync Alert!")

print("\n==================================================")
print("ALL 3 TEST EMAILS DISPATCHED SUCCESSFULLY TO:", recipient)
print("==================================================")

