import smtplib
import os
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent.parent / "Backend"
sys.path.insert(0, str(backend_dir))
load_dotenv(backend_dir / ".env")

from app.database import SessionLocal
from app.models.user import User
from app.services.email_templates import build_existing_user_announcement_template

smtp_user = os.getenv("SMTP_USER", "farmiq.in@gmail.com")
smtp_pass = os.getenv("SMTP_PASSWORD")

db = SessionLocal()

# Target recipients (Google authenticated real accounts in the database)
target_users = [
    {"name": "Jonnalagadda Lakshmi Sai Madhu", "email": "jlakshmisaimadhu@gmail.com"}
]

# If there are any other real gmail users in the DB, add them
db_users = db.query(User).filter(User.email.like("%@gmail.com")).all()
for u in db_users:
    if u.email != "jlakshmisaimadhu@gmail.com":
        target_users.append({"name": u.full_name or u.username, "email": u.email})

db.close()

print(f"Connecting to SMTP ({smtp_user}) to dispatch Real-Time 'A Heartfelt Thank You' Emails...")

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login(smtp_user, smtp_pass)

    for user in target_users:
        u_name = user["name"]
        u_email = user["email"]
        print(f"-> Dispatching personalized email to: {u_name} ({u_email})...")

        template = build_existing_user_announcement_template(user_name=u_name, user_email=u_email)
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = template["subject"]
        msg["From"] = f"FarmIQ Team <{smtp_user}>"
        msg["To"] = u_email
        msg.attach(MIMEText("Thank you from the FarmIQ Team. Please view in an HTML client.", "plain"))
        msg.attach(MIMEText(template["html"], "html"))

        server.sendmail(smtp_user, u_email, msg.as_string())
        print(f"   [SUCCESS] Delivered to: {u_email}")

print("\n==================================================")
print("REAL-TIME THANK YOU ANNOUNCEMENT DISPATCH COMPLETE!")
print("==================================================")
