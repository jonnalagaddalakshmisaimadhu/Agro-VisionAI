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
# Navigate to server directory
cd server

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
# Navigate back to root directory
cd ..

# Install dependencies
npm install
```

### 4. Environment Configuration

Create a `.env.local` file in the root directory (copy from `env.example`):

```bash
# Copy example file
cp env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Google Gemini API Key (for AI features)
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Backend API URL (default: http://localhost:8000)
VITE_API_URL=http://localhost:8000
```

### 5. Database Setup

The database will be automatically created on first run. The SQLite database file (`farmiq.db`) will be created in the `server/` directory.

## 🚀 Running the Application

### Option 1: Manual Start (Recommended for Development)

**Terminal 1 - Start Backend:**
```bash
cd server
.\venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/macOS
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Option 2: Using Startup Scripts

**Windows:**
```bash
# Start backend
.\start-backend.bat

# Start frontend (in another terminal)
.\start-frontend.bat
```

**Linux/macOS:**
```bash
# Start backend
chmod +x start-backend.sh
./start-backend.sh

# Start frontend (in another terminal)
chmod +x start-frontend.sh
./start-frontend.sh
```

## 📁 Project Structure

```
farm-iq-ai-agro-main/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API service functions
│   ├── context/           # React context providers
│   └── utils/             # Utility functions
├── server/                # Backend FastAPI application
│   ├── app/
│   │   ├── routers/       # API route handlers
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── core/          # Core configuration
│   ├── models/            # ML model files
│   └── main.py           # FastAPI application entry point
├── public/                # Static assets
├── package.json          # Frontend dependencies
└── requirements.txt      # Backend dependencies
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

Full API documentation available at `/docs` when backend is running.

## 🧪 Testing

```bash
# Frontend linting
npm run lint

# Type checking
npm run type-check

# Backend health check
curl http://localhost:8000/health
```

## 🐳 Docker Deployment (Optional)

For production deployment using Docker:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will start:
- Backend API (port 8000)
- Frontend (port 80)
- PostgreSQL database
- Redis cache
- Prometheus monitoring
- Grafana dashboards

## 🔒 Security Notes

- Change the `SECRET_KEY` in `server/app/core/config.py` for production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Configure proper CORS origins

## 📝 Notes

- The frontend uses a proxy configuration in `vite.config.ts` to forward `/api` requests to the backend
- Backend CORS is configured to allow requests from `http://localhost:8080`
- ML models should be placed in `server/models/` directory
- Database migrations are handled automatically by SQLAlchemy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Backend won't start
- Ensure Python virtual environment is activated
- Check that port 8000 is not in use
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Frontend won't connect to backend
- Ensure backend is running on port 8000
- Check CORS configuration in `server/app/core/config.py`
- Verify proxy settings in `vite.config.ts`

### Database errors
- Delete `server/farmiq.db` to reset the database
- Ensure SQLite is properly installed

## 📞 Support

For issues and questions, please open an issue on the repository.
