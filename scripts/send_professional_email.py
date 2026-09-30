import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv

# Load Backend environment variables
backend_env = Path(__file__).resolve().parent.parent / "Backend" / ".env"
load_dotenv(backend_env)

smtp_user = os.getenv("SMTP_USER", "farmiq.in@gmail.com")
smtp_pass = os.getenv("SMTP_PASSWORD")
recipient = "jlakshmisaimadhu@gmail.com"

msg = MIMEMultipart("alternative")
msg["Subject"] = "[Notice] FarmIQ Notification Pipeline Activated — Environment: Production"
msg["From"] = f"FarmIQ Engineering <{smtp_user}>"
msg["To"] = recipient

html_content = """<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FarmIQ System Notice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 48px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
                    
                    <!-- TOP BRAND BAR -->
                    <tr>
                        <td style="padding: 28px 36px 20px 36px; border-bottom: 1px solid #f4f4f5;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="left">
                                        <div style="font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #09090b;">
                                            FARMIQ <span style="color: #059669; margin: 0 2px;">/</span> AGRO-VISION
                                        </div>
                                    </td>
                                    <td align="right">
                                        <span style="display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #059669; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                                            SYSTEM OPERATIONAL
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- MAIN CONTENT -->
                    <tr>
                        <td style="padding: 36px 36px 28px 36px;">
                            
                            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                                Deployment Notice &bull; Ref: FIQ-SYS-2026-09
                            </div>

                            <h1 style="margin: 0 0 16px 0; font-size: 21px; font-weight: 600; line-height: 1.35; color: #09090b; letter-spacing: -0.3px;">
                                Real-Time Communications &amp; Notification Engine Live
                            </h1>

                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                                Hello Madhu,
                            </p>

                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                                This deployment notice confirms that the communications infrastructure for <strong>Agro-VisionAI</strong> has been provisioned and integrated into your production environment. Both authenticated SMTP messaging and Firebase Cloud Messaging (FCM) push dispatch channels are verified and actively routing events for your account (<code style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; background-color: #f4f4f5; padding: 2px 6px; border-radius: 4px; color: #09090b;">jlakshmisaimadhu@gmail.com</code>).
                            </p>

                            <!-- CONFIGURATION SPECIFICATION TABLE -->
                            <div style="margin: 0 0 28px 0; border: 1px solid #e4e4e7; border-radius: 6px; overflow: hidden;">
                                <div style="background-color: #fafafa; padding: 10px 16px; border-bottom: 1px solid #e4e4e7; font-size: 12px; font-weight: 600; color: #52525b; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Service Configuration Summary
                                </div>
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                                    <tr style="border-bottom: 1px solid #f4f4f5;">
                                        <td style="padding: 10px 16px; color: #71717a; width: 38%; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px;">Primary Dispatcher</td>
                                        <td style="padding: 10px 16px; color: #09090b; font-weight: 500;">farmiq.in@gmail.com</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f4f4f5; background-color: #fafafa;">
                                        <td style="padding: 10px 16px; color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px;">Push Provider</td>
                                        <td style="padding: 10px 16px; color: #09090b; font-weight: 500;">Firebase Cloud Messaging (FCM v1)</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f4f4f5;">
                                        <td style="padding: 10px 16px; color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px;">Project ID</td>
                                        <td style="padding: 10px 16px; color: #09090b; font-weight: 500;">farmiq-agrovisionai</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f4f4f5; background-color: #fafafa;">
                                        <td style="padding: 10px 16px; color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px;">Transport Security</td>
                                        <td style="padding: 10px 16px; color: #09090b; font-weight: 500;">TLS 1.3 / Authenticated Service Account</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 16px; color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px;">Active Modules</td>
                                        <td style="padding: 10px 16px; color: #09090b; font-weight: 500;">Weather Hazards, Pathology, Navigation Alerts</td>
                                    </tr>
                                </table>
                            </div>

                            <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.65; color: #52525b;">
                                Endpoints under <code style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; background-color: #f4f4f5; padding: 2px 6px; border-radius: 4px; color: #09090b;">/api/notifications/*</code> are listening for background telemetry, automated broadcast topics, and direct device push dispatch.
                            </p>

                            <!-- CLEAN CALL TO ACTION -->
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td align="left">
                                        <a href="https://farmiq-agrovisionai.web.app" style="display: inline-block; background-color: #09090b; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 22px; border-radius: 6px; letter-spacing: 0.2px;">
                                            Open Console &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- SIGN-OFF -->
                            <div style="border-top: 1px solid #f4f4f5; padding-top: 20px;">
                                <div style="font-size: 14px; font-weight: 600; color: #09090b;">FarmIQ Engineering Team</div>
                                <div style="font-size: 12px; color: #71717a; margin-top: 2px;">Platform Infrastructure &amp; Communications Services</div>
                            </div>

                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 20px 36px; font-size: 12px; color: #71717a; line-height: 1.5;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="left" style="color: #71717a; font-size: 11px;">
                                        FarmIQ &bull; jonnalagaddalakshmisaimadhu/Agro-VisionAI
                                    </td>
                                    <td align="right" style="color: #a1a1aa; font-size: 11px;">
                                        Automated System Notice
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

plain_text = """[Notice] FarmIQ Notification Pipeline Activated — Environment: Production

Hello Madhu,

This deployment notice confirms that the communications infrastructure for Agro-VisionAI has been provisioned and integrated into your production environment. Both authenticated SMTP messaging and Firebase Cloud Messaging (FCM) push dispatch channels are verified and actively routing events for your account (jlakshmisaimadhu@gmail.com).

SERVICE CONFIGURATION SUMMARY:
- Primary Dispatcher: farmiq.in@gmail.com
- Push Provider: Firebase Cloud Messaging (FCM v1)
- Project ID: farmiq-agrovisionai
- Transport Security: TLS 1.3 / Authenticated Service Account
- Active Modules: Weather Hazards, Pathology, Navigation Alerts

Endpoints under /api/notifications/* are listening for background telemetry, automated broadcast topics, and direct device push dispatch.

Access Platform Console: https://farmiq-agrovisionai.web.app

FarmIQ Engineering Team
Platform Infrastructure & Communications Services
"""

msg.attach(MIMEText(plain_text, "plain"))
msg.attach(MIMEText(html_content, "html"))

print(f"Connecting to SMTP to send professional notice to {recipient}...")
with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login(smtp_user, smtp_pass)
    server.sendmail(smtp_user, recipient, msg.as_string())

print("SUCCESS! Professional system notice dispatched to:", recipient)
