import smtplib
import os
import sys
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent.parent / "Backend"
sys.path.insert(0, str(backend_dir))
load_dotenv(backend_dir / ".env")

from app.services.email_templates import build_existing_user_announcement_template

smtp_user = os.getenv("SMTP_USER", "farmiq.in@gmail.com")
smtp_pass = os.getenv("SMTP_PASSWORD")
destination_mailbox = "jlakshmisaimadhu@gmail.com"

print("==================================================")
print("DISPATCHING DEMONSTRATION EMAILS TO PROVE ISOLATION")
print(f"Destination Inbox: {destination_mailbox}")
print("==================================================")

# -----------------------------------------------------------------------------
# DEMO 1: What another user (e.g. Ramesh Patel) receives
# -----------------------------------------------------------------------------
print("\n[1/2] Sending: What Farmer 'Ramesh Patel' receives (Notice 0 mention of Madhu)...")
t_ramesh = build_existing_user_announcement_template(
    user_name="Ramesh Patel",
    user_email="ramesh.patel.farmer@gmail.com"
)

msg_ramesh = MIMEMultipart("alternative")
msg_ramesh["Subject"] = "[Proof Demo for Ramesh Patel] " + t_ramesh["subject"]
msg_ramesh["From"] = f"FarmIQ Team <{smtp_user}>"
msg_ramesh["To"] = destination_mailbox
msg_ramesh.attach(MIMEText("Please view in HTML client.", "plain"))
msg_ramesh.attach(MIMEText(t_ramesh["html"], "html"))

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login(smtp_user, smtp_pass)
    server.sendmail(smtp_user, destination_mailbox, msg_ramesh.as_string())

print("[OK] Demo 1 delivered! (Shows Ramesh Patel's name and email only)")

time.sleep(2)

# -----------------------------------------------------------------------------
# DEMO 2: What Madhu receives
# -----------------------------------------------------------------------------
print("\n[2/2] Sending: What 'Jonnalagadda Lakshmi Sai Madhu' receives...")
t_madhu = build_existing_user_announcement_template(
    user_name="Jonnalagadda Lakshmi Sai Madhu",
    user_email="jlakshmisaimadhu@gmail.com"
)

msg_madhu = MIMEMultipart("alternative")
msg_madhu["Subject"] = "[Your Personal Copy] " + t_madhu["subject"]
msg_madhu["From"] = f"FarmIQ Team <{smtp_user}>"
msg_madhu["To"] = destination_mailbox
msg_madhu.attach(MIMEText("Please view in HTML client.", "plain"))
msg_madhu.attach(MIMEText(t_madhu["html"], "html"))

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login(smtp_user, smtp_pass)
    server.sendmail(smtp_user, destination_mailbox, msg_madhu.as_string())

print("[OK] Demo 2 delivered! (Shows your name and email only)")

print("\n==================================================")
print("SUCCESSFULLY DELIVERED BOTH TO:", destination_mailbox)
print("==================================================")
