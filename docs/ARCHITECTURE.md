# Agro-VisionAI (FarmIQ) — Architecture & Directory Layout

## 📌 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 18 + Vite)               │
│                                                             │
│  ┌───────────────────────┐       ┌────────────────────────┐ │
│  │   Landing & Showcase  │       │  Dashboard & Modules   │ │
│  │    (LandingPage.tsx)  │       │   (DashboardMainContent│ │
│  └──────────┬────────────┘       │    Crop, Disease, etc.)│ │
│             │                    └───────────┬────────────┘ │
│             │                                │              │
│  ┌──────────▼────────────┐                   │              │
│  │   Auth & User Session ├───────────────────┘              │
│  │  (AuthContext, JWT)   │                                  │
│  └──────────┬────────────┘                                  │
└─────────────┼───────────────────────────────────────────────┘
              │ HTTP / REST / WebSockets (Port 8000)
┌─────────────▼───────────────────────────────────────────────┐
│                    Backend (FastAPI Engine)                 │
│                                                             │
│  ┌───────────────────────┐       ┌────────────────────────┐ │
│  │    API Routers        │       │  AI / ML Services      │ │
│  │  - /api/auth          │       │  - PyTorch CNN Model   │ │
│  │  - /api/disease       │◄─────►│  - Soil KNN Predictor  │ │
│  │  - /api/crops         │       │  - Weather Aggregator  │ │
│  │  - /api/marketplace   │       │  - Groq / LLM Engine   │ │
│  │  - /api/equipment     │       │  - Agmarknet / eNAM    │ │
│  │  - /api/community     │       │  - Government Schemes  │ │
│  └──────────┬────────────┘       └────────────────────────┘ │
│             │                                               │
│  ┌──────────▼────────────┐       ┌────────────────────────┐ │
│  │  SQLite (farmiq.db)   │       │ Static / Upload Assets │ │
│  │  SQLAlchemy ORM       │       │ (/uploads/detections)  │ │
│  └───────────────────────┘       └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Directory Structure

```
Agro-VisionAI/
├── Frontend/                 # React + TypeScript + Vite Web Application
│   ├── src/
│   │   ├── assets/           # Platform images & illustrations
│   │   ├── components/       # UI Components & Modules
│   │   │   ├── chatbot/      # AI Assistant floating widget
│   │   │   ├── common/       # Shared utility UI (GoogleTranslate, ProtectedRoute)
│   │   │   ├── dashboard/    # Dashboard layout (Header, Sidebar, Content, Footer)
│   │   │   ├── modules/      # Feature modules (Crop, Disease, Market, Rental, etc.)
│   │   │   ├── ui/           # shadcn/ui Tailwind primitives
│   │   │   ├── Dashboard.tsx # Main dashboard orchestrator
│   │   │   └── LandingPage.tsx # Public hero landing page
│   │   ├── context/          # React context providers (AuthContext, LocationContext)
│   │   ├── hooks/            # Custom reusable hooks (use-toast, use-mobile)
│   │   ├── lib/              # Firebase & styling utilities
│   │   ├── pages/            # Top-level route pages (Index, Auth, Profile, Settings)
│   │   ├── services/         # API clients for backend communication
│   │   ├── types/            # TypeScript data contracts & models
│   │   ├── utils/            # Performance & helper functions
│   │   ├── App.tsx           # Router & provider declarations
│   │   └── main.tsx          # React application entrypoint
│   ├── public/               # Static media, equipment photos & aquaculture videos
│   ├── package.json          # Node dependencies & frontend scripts
│   └── vite.config.ts        # Vite build configuration
│
├── Backend/                  # FastAPI Python Application
│   ├── app/
│   │   ├── core/             # Application config, environment, security & JWT
│   │   ├── database.py       # SQLite connection and session management
│   │   ├── database_mongo.py # MongoDB connection (optional)
│   │   ├── models/           # SQLAlchemy database entities
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routers/          # REST & WebSocket route handlers
│   │   ├── services/         # Business logic, ML models, scraping, and LLM integrations
│   │   └── utils/            # Profiling and performance utilities
│   ├── data/                 # Datasets (Soil NPK dataset & regional data)
│   ├── models/               # PyTorch weights & Whisper voice model
│   ├── scripts/              # Seed scripts & diagnostic utilities
│   ├── uploads/              # Runtime uploaded images (disease detection, equipment)
│   ├── main.py               # FastAPI server entrypoint
│   └── requirements.txt      # Python dependencies
│
├── docs/                     # Documentation & Guides
│   ├── ARCHITECTURE.md       # This file
│   ├── PRESENTATION_GUIDE.md # Presentation script & demo guide
│   ├── QUICKSTART.md         # Quick onboarding steps
│   ├── FOSS_Solutions_Guide.md
│   └── Developer_Report.md
│
├── start-project.bat         # 1-Click Dual Server Startup Script (Windows)
├── package.json              # Root scripts (dev, build, backend, start)
├── .gitignore                # Global Git ignore rules
└── README.md                 # Project Overview & Documentation
```

---

## ⚡ Quick Execution Reference

- **1-Click Start (Windows)**: Run `start-project.bat`
- **Manual Start**:
  - **Backend**: `cd Backend && .\venv\Scripts\activate && python main.py`
  - **Frontend**: `cd Frontend && npm run dev`
