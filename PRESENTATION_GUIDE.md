# 🚀 Farm IQ - Hackathon Presentation & Run Guide

Good luck with your presentation! Follow these exact steps to start the project.

## 📋 Pre-requisites
Ensure you have the following installed (which you already do!):
- Node.js
- Python 3.10+

---

## 🟢 Step 1: Start the Backend (Brain)
**Open Terminal #1** (Command Prompt or PowerShell) inside the `farm-iq-ai-agro-main` folder.

Run these commands one by one:
```powershell
cd server
.\venv\Scripts\activate
python main.py
```
**Success Indicator:** 
You should see: `INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)`

---

## 🔵 Step 2: Start the Frontend (UI)
**Open Terminal #2** (New Window) inside the `farm-iq-ai-agro-main` folder.

Run these commands:
```powershell
npm run dev
```
**Success Indicator:**
You should see a Local URL, typically: `http://localhost:8080/`

---

## 🎯 Demo Walkthrough Script

### **1. Introduction (Home Page)**
- Open `http://localhost:8080/` in Chrome/Edge.
- Show the **Hero Section**: "Empowering Farmers with AI".
- Scroll down to show features (Weather, Disease Detection, Market Prices).

### **2. AI Disease Detection (The "Wow" Factor)**
- Click **"Disease Detection"** in the nav or "Get Started".
- **Upload an Image**: Use the sample plant images you have.
- Click **"Analyze"**.
- **Show Results**:
    - "Look, it identified 'Maize: Bacterial Leaf Streak'!"
    - Show the **Green Bullet Points** (Symptoms/Preventions).
- **Embedded Chat** (New Feature):
    - Scroll down to the "AI Disease Consultant" box.
    - Click the **Microphone** button.
    - Ask: *"What is the best chemical treatment for this?"*
    - Show how it replies specifically about the detected disease.

### **3. AI Chatbot (Floating Bot)**
- Click the **Green Chat Bubble** (Bottom Right).
- Ask a general question: *"Suggest crop schedule for Cotton in Hyderabad"*.
- Show the **Table Output** and nicely formatted response.

### **4. Location & Maps**
- Click **"Location Services"**.
- Show the map loading and nearby agri-stores (if API key permits) or just the layout.

---

## 🛠️ Troubleshooting (If things go wrong)

**Issue: "Backend Not Connected" or "Network Error"**
1. Check Terminal #1. Is it running?
2. If it crashed, press `Ctrl+C` and run `python main.py` again.
3. If it says "Address already in use", run this command to kill the old process:
   ```powershell
   taskkill /IM python.exe /F
   ```
   Then run `python main.py` again.

**Issue: Chatbot not replying**
1. Check your internet connection (it needs to talk to Gemini/Groq APIs).
2. Ensure Terminal #1 shows "POST /api/chat 200 OK".

---
**🏆 You are ready! Go crush it!**
