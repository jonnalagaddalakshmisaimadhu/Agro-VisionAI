# FarmIQ AI Agro - Smart Farming Platform

A comprehensive AI-powered smart farming platform with disease detection, crop recommendations, market prices, weather forecasts, and government scheme information.

## 🚀 Features

- **Disease Detection**: AI-powered crop disease detection using machine learning models
- **Crop Recommendations**: Get personalized crop recommendations based on location and soil data
- **Market Prices**: Real-time market price information for agricultural products
- **Weather Forecasts**: Accurate weather predictions for farming planning
- **Government Schemes**: Information about available government agricultural schemes
- **Marketplace**: Buy and sell agricultural products
- **Equipment Rental**: Rent farming equipment

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui for UI components
- React Router for navigation
- React Query for data fetching
- Recharts for data visualization

### Backend
- FastAPI (Python)
- SQLite database (can be upgraded to PostgreSQL)
- PyTorch for ML models
- JWT authentication
- CORS enabled for frontend integration

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/downloads/)
- **npm** or **yarn** package manager

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd farm-iq-ai-agro-main
```

### 2. Backend Setup

```bash
# Navigate to Backend directory
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\activate
# Windows (CMD):
venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to Frontend directory
cd ../Frontend

# Install dependencies
npm install
```

### 4. Environment Configuration

Create a `.env.local` file in the `Frontend/` directory:

```env
# Google Gemini API Key (for AI features)
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Backend API URL (default: http://localhost:8000)
VITE_API_URL=http://localhost:8000
```

### 5. Database Setup

The database will be automatically created on first run. The SQLite database file (`farmiq.db`) will be created in the `Backend/` directory.

## 🚀 Running the Application

### Option 1: 1-Click Startup (Windows)

Simply double-click or run:
```cmd
start-project.bat
```

### Option 2: Manual Start

**Terminal 1 - Start Backend:**
```bash
cd Backend
.\venv\Scripts\activate  # Windows
python main.py
```

**Terminal 2 - Start Frontend:**
```bash
cd Frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Project Structure

```
Agro-VisionAI/
├── Frontend/               # React 18 + TypeScript + Vite Application
│   ├── src/
│   │   ├── components/     # UI components & feature modules
│   │   ├── pages/          # Application route pages
│   │   ├── services/       # API clients & services
│   │   ├── context/        # React context providers (Auth, Weather, Location)
│   │   └── types/          # TypeScript interface definitions
│   └── package.json
├── Backend/                # FastAPI Application & AI Services
│   ├── app/
│   │   ├── routers/        # REST & WebSocket API endpoints
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── schemas/        # Pydantic data schemas
│   │   ├── services/       # ML inference & external API logic
│   │   └── core/           # Config, CORS & Security
│   ├── models/             # PyTorch CNN plant disease models
│   ├── data/               # Soil datasets & Scikit-Learn KNN models
│   ├── main.py             # FastAPI entry point
│   └── requirements.txt
├── start-project.bat       # Dual-server startup script
├── PRESENTATION_GUIDE.md   # Presentation script & demo steps
├── QUICKSTART.md           # Fast onboarding steps
└── README.md
```

## 🔌 API Endpoints

The backend provides the following main API endpoints:

- `/api/auth/*` - Authentication (register, login, user management)
- `/api/disease/*` - Disease detection
- `/api/weather/*` - Weather forecasts
- `/api/marketplace/*` - Marketplace operations
- `/api/equipment/*` - Equipment rental
- `/api/schemes/*` - Government schemes
- `/api/crops/*` - Crop recommendations
- `/api/market-prices/*` - Market prices
- `/api/community/*` - Real-time WebSocket farmer community chat

Full API documentation available at `/docs` when backend is running.

