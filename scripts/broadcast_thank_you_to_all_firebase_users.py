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

import firebase_admin
from firebase_admin import credentials, auth
from app.services.email_templates import build_existing_user_announcement_template

cred_path = backend_dir / "farmiq-agrovisionai-firebase-adminsdk-fbsvc-e27d76ac68.json"
if not firebase_admin._apps:
    cred = credentials.Certificate(str(cred_path))
    firebase_admin.initialize_app(cred)

smtp_user = os.getenv("SMTP_USER", "farmiq.in@gmail.com")
smtp_pass = os.getenv("SMTP_PASSWORD")

print("==================================================================")
print("FETCHING ALL AUTHENTICATED GOOGLE USERS FROM FIREBASE AUTH...")
print("==================================================================")

seen_emails = set()
recipients = []

page = auth.list_users()
for user in page.iterate_all():
    email = user.email
    if not email:
        continue
    email_clean = email.strip().lower()
    
    # Exclude sender email
    if email_clean == smtp_user.lower():
        continue
    
    if email_clean in seen_emails:
        continue
    seen_emails.add(email_clean)

    # Determine real display name
    name = user.display_name
    if not name or name.strip() == "":
        name = email_clean.split("@")[0].replace(".", " ").replace("_", " ").title()

    recipients.append({"name": name.strip(), "email": email.strip()})

print(f"Found {len(recipients)} unique authenticated Google users to notify:\n")
for i, r in enumerate(recipients, 1):
    print(f"{i:2d}. Name: {r['name']:<35} | Email: {r['email']}")

print("\nStarting SMTP dispatch...")
success_count = 0
failed_count = 0

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login(smtp_user, smtp_pass)

    for i, r in enumerate(recipients, 1):
        u_name = r["name"]
        u_email = r["email"]

        print(f"[{i}/{len(recipients)}] Sending personalized email to: {u_name} <{u_email}>...")
        try:
            template = build_existing_user_announcement_template(user_name=u_name, user_email=u_email)

            msg = MIMEMultipart("alternative")
            msg["Subject"] = template["subject"]
            msg["From"] = f"FarmIQ Team <{smtp_user}>"
            msg["To"] = u_email
            msg.attach(MIMEText("Thank you from FarmIQ Team. Please view in an HTML client.", "plain"))
            msg.attach(MIMEText(template["html"], "html"))

            server.sendmail(smtp_user, u_email, msg.as_string())
            print(f"      [OK] Successfully delivered to {u_email}")
            success_count += 1
            time.sleep(1)  # 1 second rate limit to ensure smooth SMTP throughput
        except Exception as e:
            print(f"      [ERROR] Failed to deliver to {u_email}: {e}")
            failed_count += 1

print("\n==================================================================")
print(f"DISPATCH COMPLETE: {success_count} Delivered, {failed_count} Failed.")
print("==================================================================")
