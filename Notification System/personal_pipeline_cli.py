"""
FarmIQ - Personal Notification Pipeline CLI
Allows administrators to dispatch targeted personal notifications to any user via Email,
In-App Bell Drawer, or both simultaneously.

Usage (Interactive mode):
    python "Notification System/personal_pipeline_cli.py"

Usage (CLI flags):
    python "Notification System/personal_pipeline_cli.py" \
        --to farmer@gmail.com \
        --subject "Special Pest Advisory for Guntur Region" \
        --message "Please apply Neem oil spray before the expected rain tomorrow." \
        --channel both \
        --priority high
"""

import sys
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure root workspace and Backend are in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "Backend"))

# Load environment variables
load_dotenv(BASE_DIR / "Backend" / ".env")
load_dotenv(BASE_DIR / ".env")
load_dotenv()

from services.personal_pipeline import personal_pipeline

def run_interactive():
    print("=" * 60)
    print("   FARMIQ PERSONAL NOTIFICATION PIPELINE (ADMIN DISPATCH)   ")
    print("=" * 60)
    print("Dispatch custom messages to any user via Email and/or In-App Bell.\n")

    recipient = input("Enter Recipient Email: ").strip()
    if not recipient:
        print("[Error] Recipient email is required.")
        return

    subject = input("Enter Subject / Alert Title: ").strip()
    if not subject:
        print("[Error] Subject is required.")
        return

    print("Enter Message (Press Enter, type your message, then press Enter again):")
    message = input("> ").strip()
    if not message:
        print("[Error] Message body is required.")
        return

    print("\nSelect Channel:")
    print("1) Both (Email + In-App Bell Icon) [Default]")
    print("2) In-App Bell Icon Only")
    print("3) Email Only")
    ch_choice = input("Choice (1-3): ").strip()
    channel = "both"
    if ch_choice == "2":
        channel = "in_app"
    elif ch_choice == "3":
        channel = "email"

    print("\nSelect Priority:")
    print("1) Normal [Default]")
    print("2) High (Urgent Advisory)")
    print("3) Urgent (Critical Hazard)")
    p_choice = input("Choice (1-3): ").strip()
    priority = "normal"
    if p_choice == "2":
        priority = "high"
    elif p_choice == "3":
        priority = "urgent"

    action_url = input("\nOptional Action Link URL (leave blank if none): ").strip() or None
    action_title = None
    if action_url:
        action_title = input("Action Button Text (e.g., 'View Advisory'): ").strip() or "View Details"

    print("\n[Dispatching Personal Notification...]")
    res = personal_pipeline.dispatch_message(
        recipient_email=recipient,
        subject=subject,
        message=message,
        channel=channel,
        priority=priority,
        action_url=action_url,
        action_title=action_title
    )

    print("\n" + "-" * 60)
    print("   DISPATCH RESULT SUMMARY")
    print("-" * 60)
    print(f"Recipient:  {res.get('recipient_email')} ({res.get('recipient_name')})")
    print(f"Subject:    {res.get('subject')}")
    print(f"Channel:    {res.get('channel')}")
    if res.get("email_status"):
        e_stat = res["email_status"]
        if e_stat.get("success"):
            sim = " [Simulated]" if e_stat.get("simulated") else " [Delivered via SMTP]"
            print(f"Email:      SUCCESS{sim}")
        else:
            print(f"Email:      FAILED ({e_stat.get('error')})")
    if res.get("in_app_status"):
        ia_stat = res["in_app_status"]
        if ia_stat.get("success"):
            print(f"In-App:     SUCCESS (Notification ID #{ia_stat.get('notification_id')})")
        else:
            print(f"In-App:     FAILED ({ia_stat.get('error')})")
    print("-" * 60)

def main():
    parser = argparse.ArgumentParser(description="FarmIQ Personal Notification Pipeline CLI")
    parser.add_argument("--to", help="Recipient email address")
    parser.add_argument("--subject", help="Message subject or alert title")
    parser.add_argument("--message", help="Message body content")
    parser.add_argument("--channel", choices=["both", "email", "in_app"], default="both", help="Delivery channel")
    parser.add_argument("--priority", choices=["urgent", "high", "normal", "low"], default="normal", help="Priority level")
    parser.add_argument("--action-url", help="Optional action URL")
    parser.add_argument("--action-title", default="View Details", help="Text for action button")

    args = parser.parse_args()

    if not args.to or not args.subject or not args.message:
        run_interactive()
    else:
        res = personal_pipeline.dispatch_message(
            recipient_email=args.to,
            subject=args.subject,
            message=args.message,
            channel=args.channel,
            priority=args.priority,
            action_url=args.action_url,
            action_title=args.action_title if args.action_url else None
        )
        print("Dispatch Result:", res)

if __name__ == "__main__":
    main()
