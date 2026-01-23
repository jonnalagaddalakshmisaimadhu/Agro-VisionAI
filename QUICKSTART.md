# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Setup Backend

```bash
cd server
python -m venv venv
.\venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be available at: **http://localhost:8000**
API Docs: **http://localhost:8000/docs**

### Step 2: Setup Frontend

Open a **new terminal**:

```bash
npm install
npm run dev
```

Frontend will be available at: **http://localhost:8080**

### Step 3: Configure Environment (Optional)

Create `.env.local` file in root directory:

```env
VITE_GEMINI_API_KEY=your-api-key-here
VITE_API_URL=http://localhost:8000
```

## ✅ Verification

1. Backend health check: http://localhost:8000/health
2. Frontend: http://localhost:8080
3. API Documentation: http://localhost:8000/docs

## 🔧 Using Startup Scripts (Windows)

**Terminal 1:**
```bash
.\start-backend.bat
```

**Terminal 2:**
```bash
.\start-frontend.bat
```

## 🔧 Using Startup Scripts (Linux/macOS)

**Terminal 1:**
```bash
chmod +x start-backend.sh
./start-backend.sh
```

**Terminal 2:**
```bash
chmod +x start-frontend.sh
./start-frontend.sh
```

## 🐛 Troubleshooting

- **Backend won't start**: Make sure port 8000 is not in use
- **Frontend can't connect**: Ensure backend is running first
- **CORS errors**: Check that backend CORS allows `http://localhost:8080`

