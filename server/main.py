# FarmIQ Backend Main Entry Point - Updated with Groq 5-point logic
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from pathlib import Path

from app.routers import (
    auth, 
    disease_detection, 
    weather, 
    marketplace, 
    equipment, 
    government_schemes,
    crop_recommendation,
    farm_market,
    market_prices,
    profit,
    recommendations,
    soil_district,
    soil_knn,
    chatbot,
    community_chat
)
from app.database import engine, Base
from app.core.config import settings
from app.services.scheduler import scheduler_service
from app.database_mongo import mongo_db

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="FarmIQ AI Agro Backend",
    description="AI-powered smart farming platform backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for model storage
app.mount("/models", StaticFiles(directory="models"), name="models")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(disease_detection.router, prefix="/api/disease", tags=["Disease Detection"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(equipment.router, prefix="/api/equipment", tags=["Equipment Rental"])
app.include_router(government_schemes.router, prefix="/api/schemes", tags=["Government Schemes"])
app.include_router(crop_recommendation.router, prefix="/api/crops", tags=["Crop Recommendation"])
app.include_router(farm_market.router, prefix="/api/farm-market", tags=["Farm Market"])
app.include_router(market_prices.router, prefix="/api/market-prices", tags=["Market Prices"])
app.include_router(profit.router, prefix="/api/profit", tags=["Profit Prediction"])
app.include_router(recommendations.router, prefix="/api", tags=["Recommendations"])
app.include_router(soil_district.router, prefix="/api", tags=["Soil District Lookup"])
app.include_router(soil_knn.router, prefix="/api", tags=["Soil KNN Prediction"])
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])
app.include_router(community_chat.router, prefix="/api/community", tags=["Community Chat"])

@app.get("/")
async def root():
    return {
        "message": "FarmIQ AI Agro Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "active"
    }

@app.get("/health")
async def health_check():
    mongo_status = "disconnected"
    try:
        # Check simplistic client existence
        if mongo_db.client:
            # Perform actual ping
            await mongo_db.client.admin.command('ping')
            mongo_status = "connected"
    except Exception as e:
        mongo_status = f"error: {str(e)}"

    return {
        "status": "healthy", 
        "message": "FarmIQ Backend is running",
        "mongodb": mongo_status
    }

@app.on_event("startup")
async def startup_event():
    """Start background services on app startup"""
    await scheduler_service.start_scheduler()
    await mongo_db.connect()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop background services on app shutdown"""
    await scheduler_service.stop_scheduler()
    await mongo_db.close()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )

