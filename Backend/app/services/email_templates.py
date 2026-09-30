from typing import Dict, Any, Optional

def build_google_onboarding_template(user_name: str, user_email: str) -> Dict[str, str]:
    """
    Template 1: New User Google Authentication Welcome & Complete Feature Tour.
    Clean, high-end enterprise layout with zero cheesy gimmicks.
    """
    subject = f"Welcome to FarmIQ — Getting Started with your AI Precision Platform"
    
    html = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to FarmIQ</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 48px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="padding: 28px 36px 20px 36px; border-bottom: 1px solid #f4f4f5;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="left">
                                        <div style="font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #09090b;">
                                            FARMIQ <span style="color: #059669; margin: 0 2px;">/</span> AGRO-VISION AI
                                        </div>
                                    </td>
                                    <td align="right">
                                        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #059669; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                                            ACCOUNT ACTIVE
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                        <td style="padding: 36px 36px 28px 36px;">
                            
                            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                                Google Identity Verification Successful
                            </div>

                            <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; line-height: 1.35; color: #09090b; letter-spacing: -0.3px;">
                                Welcome to FarmIQ, {user_name}
                            </h1>

                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                                Your account has been authenticated via Google Identity (<code style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; background-color: #f4f4f5; padding: 2px 6px; border-radius: 4px; color: #09090b;">{user_email}</code>). You now have full access to our autonomous precision agriculture and real-time logistics ecosystem.
                            </p>

                            <!-- FEATURE GRID -->
                            <div style="margin: 0 0 28px 0; border: 1px solid #e4e4e7; border-radius: 6px; overflow: hidden;">
                                <div style="background-color: #fafafa; padding: 12px 18px; border-bottom: 1px solid #e4e4e7; font-size: 12px; font-weight: 600; color: #52525b; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Core Integrated Capabilities
                                </div>
                                
                                <div style="padding: 16px 18px; border-bottom: 1px solid #f4f4f5;">
                                    <div style="font-size: 14px; font-weight: 600; color: #09090b; margin-bottom: 3px;">1. AI Plant Disease Vision</div>
                                    <div style="font-size: 13px; color: #71717a; line-height: 1.5;">Instant crop leaf diagnosis powered by deep-learning vision models. Upload a photo to detect blight, rust, or pests with chemical & organic cure remedies.</div>
                                </div>

                                <div style="padding: 16px 18px; border-bottom: 1px solid #f4f4f5; background-color: #fafafa;">
                                    <div style="font-size: 14px; font-weight: 600; color: #09090b; margin-bottom: 3px;">2. Microclimate Radar &amp; Weather Sentinel</div>
                                    <div style="font-size: 13px; color: #71717a; line-height: 1.5;">Hyper-local 48-hour precipitation forecasting, humidity indexing, and automated spraying safety advisory before rain arrives.</div>
                                </div>

                                <div style="padding: 16px 18px; border-bottom: 1px solid #f4f4f5;">
                                    <div style="font-size: 14px; font-weight: 600; color: #09090b; margin-bottom: 3px;">3. Real-Time Transport &amp; Fleet Navigation</div>
                                    <div style="font-size: 13px; color: #71717a; line-height: 1.5;">High-speed OSRM topological routing engine tailored for crop logistics from farm plot to APMC mandis with live congestion bypasses.</div>
                                </div>

                                <div style="padding: 16px 18px; border-bottom: 1px solid #f4f4f5; background-color: #fafafa;">
                                    <div style="font-size: 14px; font-weight: 600; color: #09090b; margin-bottom: 3px;">4. Mandi APMC Price Intelligence &amp; Arbitrage</div>
                                    <div style="font-size: 13px; color: #71717a; line-height: 1.5;">Live daily Agmarknet market rates across 2,400+ centers. Our autonomous scout compares prices and factors transport costs to discover optimal sales windows.</div>
                                </div>

                                <div style="padding: 16px 18px; border-bottom: 1px solid #f4f4f5;">
                                    <div style="font-size: 14px; font-weight: 600; color: #09090b; margin-bottom: 3px;">5. Peer-to-Peer Agri-Equipment Rental Hub</div>
                                    <div style="font-size: 13px; color: #71717a; line-height: 1.5;">Browse or list tractors, harvesters, drone sprayers, and rotavators with in-app peer communication and verified availability.</div>
                                </div>

                                <div style="padding: 16px 18px;">
                                    <div style="font-size: 14px; font-weight: 600; color: #09090b; margin-bottom: 3px;">6. Direct Government Schemes &amp; Subsidies</div>
                                    <div style="font-size: 13px; color: #71717a; line-height: 1.5;">Automated eligibility checks and step-by-step guidance for central and state agriculture programs (PM-KISAN, Rythu Bharosa, Solar Subsidies).</div>
                                </div>
                            </div>

                            <!-- CTA -->
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td align="left">
                                        <a href="https://farmiq-agrovisionai.web.app" style="display: inline-block; background-color: #09090b; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 26px; border-radius: 6px; letter-spacing: 0.2px;">
                                            Enter FarmIQ Platform &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- SIGN OFF -->
                            <div style="border-top: 1px solid #f4f4f5; padding-top: 20px;">
                                <div style="font-size: 14px; font-weight: 600; color: #09090b;">FarmIQ Engineering &amp; Operations</div>
                                <div style="font-size: 12px; color: #71717a; margin-top: 2px;">jonnalagaddalakshmisaimadhu/Agro-VisionAI</div>
                            </div>

                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 18px 36px; font-size: 11px; color: #71717a;">
                            Dispatched automatically via authenticated SMTP &bull; farmiq.in@gmail.com &bull; 2026
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return {"subject": subject, "html": html}


def build_existing_user_announcement_template(user_name: str, user_email: str) -> Dict[str, str]:
    """
    Template 2: Sincere Appreciation & Notification System Activation Announcement for Existing Google Users.
    """
    subject = f"Thank You from FarmIQ Team — Your Real-Time Notification System is Now Live"
    
    html = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Thank You from FarmIQ</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 48px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="padding: 28px 36px 20px 36px; border-bottom: 1px solid #f4f4f5;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="left">
                                        <div style="font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #09090b;">
                                            FARMIQ <span style="color: #059669; margin: 0 2px;">/</span> COMMUNITY
                                        </div>
                                    </td>
                                    <td align="right">
                                        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #059669; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                                            SYSTEM UPGRADE
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                        <td style="padding: 36px 36px 28px 36px;">

                            <h1 style="margin: 0 0 18px 0; font-size: 22px; font-weight: 600; line-height: 1.35; color: #09090b; letter-spacing: -0.3px;">
                                A Heartfelt Thank You from the FarmIQ Team
                            </h1>

                            <!-- RESPECTED USER IDENTITY CARD -->
                            <div style="margin: 0 0 24px 0; border: 1px solid #e4e4e7; border-radius: 6px; background-color: #fafafa; padding: 14px 18px;">
                                <div style="font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; text-transform: uppercase; color: #71717a; margin-bottom: 4px; font-weight: 600; letter-spacing: 0.5px;">
                                    Verified Google Account Record
                                </div>
                                <div style="font-size: 14px; font-weight: 600; color: #09090b;">
                                    {user_name} &nbsp;&bull;&nbsp; <span style="font-family: ui-monospace, monospace; font-size: 13px; font-weight: 400; color: #059669;">{user_email}</span>
                                </div>
                            </div>

                            <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                                Dear {user_name},
                            </p>

                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                                We want to express our deepest gratitude to you for placing your trust in FarmIQ as an early Google-authenticated member (<code style="font-family: ui-monospace, monospace; font-size: 12px; background-color: #f4f4f5; padding: 2px 6px; border-radius: 4px; color: #09090b;">{user_email}</code>). Your partnership and presence have been instrumental as we build the next generation of precision agriculture and intelligent logistics.
                            </p>

                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                                Today, we are proud to formally announce that the <strong>FarmIQ Real-Time Notification &amp; Alert Infrastructure</strong> has been activated for your account.
                            </p>

                            <!-- HIGHLIGHT BOX -->
                            <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                                <div style="font-size: 13px; font-weight: 600; color: #09090b; margin-bottom: 12px;">
                                    What This Means for You:
                                </div>
                                <div style="font-size: 13px; color: #52525b; line-height: 1.6; margin-bottom: 8px;">
                                    &bull; <strong>Instant Push Notifications:</strong> Critical weather hazards and regional crop disease warnings are delivered directly to your device screen within milliseconds via Firebase Cloud Messaging.
                                </div>
                                <div style="font-size: 13px; color: #52525b; line-height: 1.6; margin-bottom: 8px;">
                                    &bull; <strong>Verified Email Dispatch:</strong> Official notices and advisory reports originate securely from <strong>farmiq.in@gmail.com</strong> with 100% authenticated Google transport encryption.
                                </div>
                                <div style="font-size: 13px; color: #52525b; line-height: 1.6;">
                                    &bull; <strong>Zero-Spam &amp; Quiet Hours Guarantee:</strong> You will never receive routine timeline spam. Critical alerts respect strict quiet hours (10:00 PM – 6:00 AM) unless life or crop safety is at risk.
                                </div>
                            </div>

                            <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.65; color: #52525b;">
                                No configuration is required from your side. Your account is already enrolled in the new pipeline.
                            </p>

                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td align="left">
                                        <a href="https://farmiq-agrovisionai.web.app" style="display: inline-block; background-color: #09090b; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 22px; border-radius: 6px;">
                                            Explore FarmIQ Dashboard &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="border-top: 1px solid #f4f4f5; padding-top: 20px;">
                                <div style="font-size: 14px; font-weight: 600; color: #09090b;">With gratitude,</div>
                                <div style="font-size: 13px; font-weight: 500; color: #18181b; margin-top: 2px;">The FarmIQ Leadership &amp; Engineering Team</div>
                                <div style="font-size: 11px; color: #71717a; margin-top: 2px;">Dedicated Support: farmiq.in@gmail.com</div>
                            </div>

                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 18px 36px; font-size: 11px; color: #71717a;">
                            FarmIQ Agro-VisionAI Community &bull; Confidential &bull; 2026
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return {"subject": subject, "html": html}


def build_critical_alert_template(user_name: str, alert_title: str, alert_type: str, alert_details: str, action_label: str = "Verify Activity", action_url: str = "https://farmiq-agrovisionai.web.app") -> Dict[str, str]:
    """
    Template 3: Actionable In-App / Critical Real-Time Alert (Hazard, Security, Transport).
    """
    subject = f"[Action Required] FarmIQ Alert — {alert_title}"
    
    html = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FarmIQ Critical Notice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 48px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
                    
                    <!-- HEADER -->
                    <tr>
                        <td style="padding: 24px 36px 18px 36px; border-bottom: 1px solid #f4f4f5;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="left">
                                        <div style="font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #09090b;">
                                            FARMIQ <span style="color: #dc2626; margin: 0 2px;">/</span> ALERT ENGINE
                                        </div>
                                    </td>
                                    <td align="right">
                                        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #b91c1c; background-color: #fef2f2; border: 1px solid #fecaca; padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                                            PRIORITY: HIGH
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                        <td style="padding: 36px 36px 28px 36px;">
                            
                            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                                Event Classification: {alert_type}
                            </div>

                            <h1 style="margin: 0 0 14px 0; font-size: 20px; font-weight: 600; line-height: 1.35; color: #09090b; letter-spacing: -0.3px;">
                                {alert_title}
                            </h1>

                            <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                                Hello {user_name},
                            </p>

                            <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.65; color: #3f3f46;">
                                An actionable operational event was recorded by our real-time monitoring engine for your account:
                            </p>

                            <!-- DETAILS BOX -->
                            <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 16px 20px; margin-bottom: 24px;">
                                <div style="font-size: 13px; color: #7f1d1d; line-height: 1.6; font-weight: 500;">
                                    {alert_details}
                                </div>
                            </div>

                            <p style="margin: 0 0 28px 0; font-size: 13px; line-height: 1.6; color: #71717a;">
                                This notice has also been pushed to your in-app notification center. Please review the details below to ensure continuity of operations.
                            </p>

                            <!-- ACTION BUTTON -->
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td align="left">
                                        <a href="{action_url}" style="display: inline-block; background-color: #09090b; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 22px; border-radius: 6px;">
                                            {action_label} &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="border-top: 1px solid #f4f4f5; padding-top: 18px;">
                                <div style="font-size: 13px; font-weight: 600; color: #09090b;">FarmIQ Automated Safety Dispatch</div>
                                <div style="font-size: 11px; color: #71717a; margin-top: 2px;">In-App Bell &bull; FCM Push &bull; Direct SMTP</div>
                            </div>

                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 16px 36px; font-size: 11px; color: #71717a;">
                            FarmIQ Agro-VisionAI &bull; Automated Telemetry Event &bull; 2026
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return {"subject": subject, "html": html}
