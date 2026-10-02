# FarmIQ Agro-VisionAI — Notification System Architecture & Documentation

## 1. Overview
The **Notification System** is an enterprise-grade multi-channel communication infrastructure designed specifically for FarmIQ Agro-VisionAI. It connects farmers, administrators, and automated AI models through **three core communication channels**:
1. **Official Branded Emails** dispatched securely via Gmail SMTP TLS (`farmiq.in@gmail.com`).
2. **Interactive UI In-App Notification Center** integrated into the UI Header Bell icon (`NotificationBellPopover.tsx`), featuring unread badge indicators, category tabs, and action links.
3. **Personal Messaging Pipeline ("Personal Pipepile")** allowing admins to dispatch custom, targeted advisories or announcements directly to specific individuals or groups via Email, Bell notification, or both.

---

## 2. Directory Structure (`Notification System/`)

```
Notification System/
├── README.md                          # Comprehensive documentation & system design
├── personal_pipeline_cli.py           # Interactive & CLI dispatcher for custom personal messages
├── __init__.py
├── templates/
│   ├── welcome_email_template.html    # Default 1: Comprehensive Welcome Tour explaining ALL 7 features
│   ├── otp_verification_template.html # Default 2: Account creation/login 6-digit OTP verification email
│   └── mandi_price_ticker_template.html# Daily Mandi price ticker (Guntur, Tenali, Warangal)
├── services/
│   ├── __init__.py
│   ├── email_service.py               # SMTP engine with HTML template rendering
│   ├── otp_service.py                 # Secure 6-digit OTP generation, 10-minute TTL, & validation
│   └── personal_pipeline.py           # Admin targeted messaging engine (email + in-app)
├── routes/
│   ├── __init__.py
│   └── api_routes.py                  # FastAPI REST endpoints mounted at /api/notifications
└── client/
    ├── NotificationBellPopover.tsx    # React component for UI Header Bell notification drawer
    └── notificationStore.ts           # State machine, localStorage sync, & switch event handlers
```

---

## 3. Core Features & Implementations

### A. Default Templates
1. **Welcome Email Template (`templates/welcome_email_template.html`)**:
   - Sent automatically when a new farmer creates and verifies their account.
   - Showcases all 7 platform features with dedicated visual cards:
     1. 🌾 **Crop Recommendation & Soil Health**
     2. 🔬 **Plant Pathology & Disease Diagnostic Vision**
     3. 🏛️ **PM-KISAN & State Government Subsidies Radar**
     4. 📈 **Real-Time Mandi Price Intelligence & Tickers**
     5. 🚜 **Kisan-to-Kisan Equipment Rentals & Fleet**
     6. 🛰️ **Satellite Weather Radar & Disaster Warning System**
     7. 🤖 **24/7 Multilingual FarmIQ Voice/Chat Assistance**
2. **OTP Verification Template (`templates/otp_verification_template.html`)**:
   - Dispatched from `farmiq.in@gmail.com` during account registration or login.
   - Features a high-contrast 6-digit verification code badge, 10-minute expiry warning, and security anti-phishing advisory.

### B. UI Notifications & Default Switch State (Way OFF Mode)
As requested, all alert toggles across the application start in **OFF (Disabled) mode** by default:
- **Rain Alerts**: OFF by default
- **Temperature Warnings**: OFF by default
- **Frost Alerts**: OFF by default
- **Wind Speed Alerts**: OFF by default
- **Daily Mandi Price Ticker**: OFF by default

**Trigger-on-Activation Behavior**:
Whenever a farmer switches any toggle **ON**, the application immediately creates an in-app notification and dispatches it directly into the **UI Header Bell notification icon**:
- **Rain ON** ➔ `"🌧️ Rain Alerts Activated: Live rainfall prediction notifications are now armed (>40%)."`
- **Temp ON** ➔ `"🌡️ Temperature Warnings Activated: Extreme heatwave and cold shock monitors are active."`
- **Frost ON** ➔ `"❄️ Frost Alerts Activated: Ground frost detector armed for delicate crop canopies."`
- **Wind ON** ➔ `"💨 Wind Speed Alerts Activated: High velocity wind alert system armed (>25 km/h)."`
- **Daily Mandi Ticker ON** ➔ `"📈 Daily Mandi Price Ticker Activated: Morning summaries enabled for Guntur Mirchi, Tenali Paddy, and Warangal Cotton."`
- **Language Switch** ➔ `"🌐 Application Language Updated: Switched to [Selected Language]."`

---

## 4. Personal Messaging Pipeline ("Personal Pipepile") — System Design & Plan

### The Requirement:
> *"If i Want Seperate Msg To any ones I only say later what kind of Message should Send like that(deeniki plan emaina unte just ans me and mention me any imp notification sys design required lastly."*

### System Architecture:
The **Personal Messaging Pipeline** (`services/personal_pipeline.py`) is designed as a decoupled, multi-channel dispatch engine that accepts:
1. **Target Recipient**: Email address (e.g. `farmer@gmail.com`) or User ID.
2. **Subject**: Custom alert title or header.
3. **Message Body**: Any free-form text or multi-paragraph advisory.
4. **Channel**:
   - `both` (Default): Sends an official branded email AND injects a notification directly into their Header Bell drawer.
   - `in_app`: Places notification inside their Header Bell drawer only.
   - `email`: Sends branded advisory email only.
5. **Priority**: `normal`, `high` (Amber Warning banner), `urgent` (Red Hazard banner).
6. **Action URL**: Optional link button (e.g., directing user to `/weather`, `/market-prices`, or a custom URL).

### How to Send Personal Messages:

#### Method 1: Using the Standalone Interactive CLI
Run the interactive tool directly in your terminal:
```bash
python "Notification System/personal_pipeline_cli.py"
```
It will guide you with prompts:
```
Enter Recipient Email: user@example.com
Enter Subject: Urgent Mirchi Pest Alert
Enter Message: Please inspect field #3 for thrips infestation before spraying.
Select Channel: 1 (Both Email + Bell)
Select Priority: 2 (High)
```

#### Method 2: Command Line Flag Dispatch
```bash
python "Notification System/personal_pipeline_cli.py" \
  --to farmer@gmail.com \
  --subject "Crop Advisory for Guntur Region" \
  --message "Irrigate early morning to prevent moisture stress under 37C heat." \
  --channel both \
  --priority high \
  --action-url "/weather"
```

#### Method 3: Via FastAPI REST API
```http
POST /api/notifications/personal-message
Content-Type: application/json

{
  "recipient_email": "farmer@example.com",
  "subject": "Custom Farmer Advisory",
  "message": "Special subsidy release update for your district.",
  "channel": "both",
  "priority": "normal",
  "action_title": "Check Subsidies",
  "action_url": "/subsidies"
}
```

---

## 5. Important Future Notification System Design Recommendations
To scale this Notification System as FarmIQ grows to thousands of farmers:
1. **WhatsApp Business API & SMS Gateway (Twilio / Gupshup / Infobip)**:
   - Rural farmers in AP & Telangana check WhatsApp daily. Integrating Gupshup or WhatsApp Cloud API into `personal_pipeline.py` will allow one-click WhatsApp advisory messages in Telugu, Hindi, and English.
2. **Celery / Redis Async Task Queue**:
   - For broadcasting seasonal weather hazards or mandi tickers to 50,000+ farmers simultaneously without blocking FastAPI event loops.
3. **Admin Web Broadcast Dashboard**:
   - A dedicated tab in the Admin Panel with a rich-text composer and user filter (by District, Crop type, Land size) to dispatch personal messages with one click directly from the UI.
