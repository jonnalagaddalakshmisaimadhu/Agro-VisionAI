# FarmIQ AI Agro - Smart Farming Platform 🌾🤖

A comprehensive AI-powered smart agriculture and aquaculture platform featuring crop disease detection, localized soil & crop recommendations, live mandi market prices, weather forecasting, equipment rental, and farmer community networks.

---

## 🚀 Key Features

- 🌿 **AI Plant Disease Detection**: Convolutional Neural Network (PyTorch) for fast disease diagnosis and treatment remedies.
- 🌱 **Crop & Soil Recommendation**: Location, climate, and soil NPK-driven crop recommendations with profit estimates.
- 📈 **Real-Time Mandi Market Prices**: Automated live price tracker integrating Agmarknet and eNAM feeds.
- 🌦️ **Weather Forecasts & Agro-Alerts**: Hyper-local weather forecasting with agricultural risk advisories.
- 🚜 **Equipment Rental Marketplace**: P2P tractor, harvester, and farming machinery booking platform.
- 🛒 **Farmer Marketplace**: Direct buyer-to-seller marketplace with in-app chat.
- 🏛️ **Government Schemes**: Curated directory of Central & State government agricultural subsidies and loan schemes.
- 💬 **Multilingual AI Assistant**: Context-aware AI agronomist chatbot supporting English and regional languages.
- 👥 **Community Hub**: Real-time WebSocket discussion forum for local farmers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Lucide Icons |
| **Backend** | FastAPI (Python 3.10+), SQLAlchemy, Uvicorn, WebSockets, Pydantic |
| **AI / ML** | PyTorch (CNN Disease Model), Scikit-Learn (Soil KNN), Groq / Google Gemini APIs |
| **Database** | SQLite (`farmiq.db`) / Optional PostgreSQL / MongoDB |

---

## 📁 Clean Repository Structure

```
Agro-VisionAI/
├── Frontend/                 # React 18 + TypeScript + Vite Client Application
│   ├── src/
│   │   ├── assets/           # UI images & illustrations
│   │   ├── components/       # Reusable components & feature modules
│   │   │   ├── chatbot/      # AI Agronomist Chatbot widget
│   │   │   ├── common/       # Shared UI (Translation, ProtectedRoute)
│   │   │   ├── dashboard/    # Shell header, sidebar, navigation & footer
│   │   │   ├── modules/      # Feature screens (Disease, Crop, Market, Equipment, etc.)
│   │   │   └── ui/           # shadcn/ui Tailwind components
│   │   ├── context/          # React Contexts (AuthContext, LocationContext)
│   │   ├── hooks/            # Custom hooks (use-toast, use-mobile)
│   │   ├── pages/            # Top-level pages (Index, Auth, Profile, Settings)
│   │   ├── services/         # Typed API clients for backend integration
│   │   ├── types/            # TypeScript interfaces & models
│   │   └── App.tsx           # Route mapping & provider setup
│   └── public/               # Static media & equipment images
│
├── Backend/                  # FastAPI Application & AI Services
│   ├── app/
│   │   ├── core/             # Configuration, CORS & JWT security
│   │   ├── models/           # SQLAlchemy database entities
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── routers/          # Modular API endpoints
│   │   ├── services/         # AI services, scrapers & ML inference engines
│   │   └── utils/            # Profiling and performance utilities
│   ├── data/                 # Soil NPK datasets & regional soil data
│   ├── models/               # PyTorch weights & Whisper models
│   ├── scripts/              # Database seeders & API diagnostic tools
│   ├── uploads/              # Uploaded user images (disease scanner, equipment)
│   ├── main.py               # FastAPI entrypoint
│   └── requirements.txt      # Python dependencies
│
├── docs/                     # Project Documentation & Presentation Assets
│   ├── ARCHITECTURE.md       # System Architecture & Flowchart
│   ├── PRESENTATION_GUIDE.md # Live Presentation & Demonstration Guide
│   ├── QUICKSTART.md         # Quick Developer Onboarding
│   ├── FOSS_Solutions_Guide.md
│   └── Developer_Report.md
│
├── start-project.bat         # 1-Click Startup for Windows
├── package.json              # Root build & start scripts
└── README.md                 # Master Project Overview
```

---

## ⚡ Quickstart & Running Locally

### Option 1: 1-Click Startup (Windows)
Double-click or run:
```cmd
start-project.bat
```

### Option 2: Manual Startup

**1. Start Backend:**
```bash
cd Backend
python -m venv venv
.\venv\Scripts\activate       # Windows
# source venv/bin/activate    # Linux / macOS
pip install -r requirements.txt
python main.py
```

**2. Start Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

### Access URLs:
- **Frontend App**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📚 Detailed Documentation

- 📐 [System Architecture Guide](docs/ARCHITECTURE.md)
- 🎙️ [Presentation & Demo Guide](docs/PRESENTATION_GUIDE.md)
- ⚡ [Quickstart Guide](docs/QUICKSTART.md)
- 📄 [Developer Report](docs/Developer_Report.md)
- 🌐 [FOSS Solutions Guide](docs/FOSS_Solutions_Guide.md)
