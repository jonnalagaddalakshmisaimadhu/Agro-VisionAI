"""
================================================================================
FARMIQ (AGRO-VISION AI) — 100% COMPREHENSIVE BACKEND TEST SUITE
================================================================================
Covers All Modules:
- Module 0 : Authentication & Session Security (JWT, bcrypt, Protected Routes)
- Module 1 : Crop Recommendation, Soil KNN & District Soil Lookup
- Module 2 : Crop Disease Detection & AI Vision Remedy Pipeline
- Module 3 : Real-Time Weather Radar & 5-Day Forecast Advisories
- Module 4 : Government Schemes & Subsidies Catalog
- Module 5 : Produce Marketplace, Farm Market & Mandi Prices
- Module 6 : Equipment Rentals & Custom Hiring Center
- Module 7 & 8: AI Agricultural Chatbot & Community Channels
- Module 10: In-App Version Auto-Update Engine
- System   : Root & Health Diagnostic Endpoints
================================================================================
"""

import pytest
import httpx
import time
import os
import sys
from pathlib import Path

# Ensure Backend root is in sys.path
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'


@pytest.mark.asyncio
async def test_00_root_and_health():
    """System Health & Root Verification."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        r_root = await client.get("/")
        assert r_root.status_code == 200
        root_data = r_root.json()
        assert root_data.get("status") == "active"
        assert "version" in root_data

        r_health = await client.get("/health")
        assert r_health.status_code == 200
        health_data = r_health.json()
        assert health_data.get("status") == "healthy"


@pytest.mark.asyncio
async def test_01_auth_full_security_lifecycle():
    """Module 0: Registration, Duplicate Rejection, Login, JWT Validation & Route Guard."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        ts = int(time.time() * 1000)
        uname = f"farmer_qa_{ts}"
        email = f"{uname}@farmiq.ai"
        password = "SecurePassword@123"

        # 1. Register new user
        reg_payload = {
            "username": uname,
            "email": email,
            "password": password,
            "full_name": "QA Test Farmer"
        }
        r_reg = await client.post("/api/auth/register", json=reg_payload)
        assert r_reg.status_code == 200
        reg_data = r_reg.json()
        assert reg_data.get("username") == uname
        assert reg_data.get("email") == email

        # 2. Reject duplicate registration
        r_dup = await client.post("/api/auth/register", json=reg_payload)
        assert r_dup.status_code in [400, 409]

        # 3. Successful Login
        login_payload = {"username": uname, "password": password}
        r_login = await client.post("/api/auth/login", json=login_payload)
        assert r_login.status_code == 200
        token_data = r_login.json()
        token = token_data.get("access_token")
        assert token is not None
        assert token_data.get("token_type") == "bearer"

        # 4. Reject invalid password
        bad_login = {"username": uname, "password": "WrongPassword!999"}
        r_bad = await client.post("/api/auth/login", json=bad_login)
        assert r_bad.status_code == 401

        # 5. Access protected /me endpoint with valid Bearer token
        headers = {"Authorization": f"Bearer {token}"}
        r_me = await client.get("/api/auth/me", headers=headers)
        assert r_me.status_code == 200
        me_data = r_me.json()
        assert me_data.get("email") == email

        # 6. Reject unauthenticated /me request
        r_unauth = await client.get("/api/auth/me")
        assert r_unauth.status_code == 401


@pytest.mark.asyncio
async def test_02_crop_recommendation_and_boundaries():
    """Module 1: Agronomic Crop Recommendation & Boundary Input Evaluation."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Standard input
        payload = {
            "location": "Guntur, Andhra Pradesh",
            "soil_type": "Black Soil",
            "farm_size": 2.5,
            "season": "Kharif",
            "water_source": "Canal"
        }
        r = await client.post("/api/crops/recommend", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "recommended_crops" in data
        assert len(data["recommended_crops"]) > 0
        first_crop = data["recommended_crops"][0]
        assert "cropName" in first_crop
        assert "estimatedProfit" in first_crop

        # Boundary / Alternate Season input
        rabi_payload = {
            "location": "Krishna, Andhra Pradesh",
            "soil_type": "Alluvial",
            "farm_size": 5.0,
            "season": "Rabi",
            "water_source": "Borewell"
        }
        r_rabi = await client.post("/api/crops/recommend", json=rabi_payload)
        assert r_rabi.status_code == 200
        assert len(r_rabi.json()["recommended_crops"]) > 0


@pytest.mark.asyncio
async def test_03_soil_district_and_knn():
    """Module 1: Geospatial Soil KNN & District Soil Lookup."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. District Soil Lookup by lat/lon (Guntur coords: 16.3067, 80.4365)
        r_soil = await client.get("/api/soil?lat=16.3067&lon=80.4365")
        assert r_soil.status_code == 200
        soil_res = r_soil.json()
        assert "soil_type" in soil_res
        assert "district" in soil_res

        # 2. KNN Model Prediction endpoint
        knn_payload = {"lat": 16.3067, "lon": 80.4365}
        r_knn = await client.post("/api/predict-soil", json=knn_payload)
        assert r_knn.status_code == 200
        assert "soil_type" in r_knn.json()


@pytest.mark.asyncio
async def test_04_profit_prediction_financial_engine():
    """Module 1: 3-Scenario Profit & ROI Financial Modeling Engine."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        profit_payload = {
            "crop_name": "Paddy",
            "area_ha": 2.0,
            "expected_yield_t_per_ha": 5.5,
            "price_per_quintal": 2200.0,
            "district": "Guntur",
            "irrigation_type": "Canal",
            "farming_type": "Conventional"
        }
        r = await client.post("/api/profit/predict", json=profit_payload)
        assert r.status_code == 200
        pdata = r.json()
        assert pdata.get("crop_name") == "Paddy"
        assert pdata.get("revenue") > 0
        assert pdata.get("investment") > 0
        assert "scenarios" in pdata
        assert "best_case" in pdata["scenarios"]
        assert "worst_case" in pdata["scenarios"]
        assert "realistic" in pdata["scenarios"]
        assert "roi_percent" in pdata


@pytest.mark.asyncio
async def test_05_disease_detection_vision():
    """Module 2: AI Computer Vision Leaf Disease Classifier & Remedy Pipeline."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Standard 1x1 base64 png image
        dummy_img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        payload = {"image_base64": dummy_img}
        r = await client.post("/api/disease/predict", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "disease_name" in data
        assert "confidence_score" in data

        # Edge case: Empty / invalid base64 payload
        r_empty = await client.post("/api/disease/predict", json={"image_base64": ""})
        assert r_empty.status_code in [200, 400, 422]


@pytest.mark.asyncio
async def test_06_weather_radar_and_telemetry():
    """Module 3: Real-Time Open-Meteo Weather & 5-Day Agricultural Forecasts."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Current weather
        r_curr = await client.get("/api/weather/current/Guntur")
        assert r_curr.status_code == 200
        curr_data = r_curr.json()
        assert "weather" in curr_data or "main" in curr_data or "temperature" in curr_data

        # 5-Day Forecast
        r_fore = await client.get("/api/weather/forecast/Guntur")
        assert r_fore.status_code == 200
        fore_data = r_fore.json()
        assert "coordinates" in fore_data or "forecast" in fore_data or "daily" in fore_data


@pytest.mark.asyncio
async def test_07_government_schemes_catalog():
    """Module 4: Central & State Agricultural Subsidies and Direct Application Schemes."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        r_schemes = await client.get("/api/schemes/schemes")
        assert r_schemes.status_code == 200
        schemes = r_schemes.json()
        assert isinstance(schemes, list)
        assert len(schemes) >= 3

        r_cats = await client.get("/api/schemes/categories")
        assert r_cats.status_code == 200
        assert len(r_cats.json()) > 0


@pytest.mark.asyncio
async def test_08_equipment_rentals_catalog():
    """Module 6: Verified Machinery Catalog (Tractors, Harvesters, Drones)."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/equipment")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 4


@pytest.mark.asyncio
async def test_09_farm_market_and_prices():
    """Module 5: Produce Marketplace Catalog & Agmarknet Mandi Price Statistics."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Farm market products
        r_prod = await client.get("/api/farm-market/products")
        assert r_prod.status_code == 200
        assert isinstance(r_prod.json(), list)

        # Market prices stats summary
        r_stats = await client.get("/api/market-prices/prices/stats/summary")
        assert r_stats.status_code == 200


@pytest.mark.asyncio
async def test_10_ai_chatbot_advisor():
    """Module 8: 24/7 AI Agricultural Agronomist Chatbot (Groq/LLM)."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        chat_payload = {
            "message": "What is the recommended NPK ratio for Cotton in Black Soil?",
            "language": "en"
        }
        r = await client.post("/api/chat", json=chat_payload)
        assert r.status_code == 200
        resp = r.json()
        assert "response" in resp
        assert len(resp["response"]) > 5


@pytest.mark.asyncio
async def test_11_app_update_checker():
    """Module 10: In-App Version Auto-Update Detection & APK Distribution."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Outdated version triggers update flag
        r_old = await client.get("/api/app/check-update?current_version=1.0.0")
        assert r_old.status_code == 200
        old_data = r_old.json()
        assert old_data.get("latest_version") == "1.0.1"
        assert old_data.get("update_available") is True
        assert "apk_url" in old_data

        # 2. Current version reports up-to-date
        r_curr = await client.get("/api/app/check-update?current_version=1.0.1")
        assert r_curr.status_code == 200
        curr_data = r_curr.json()
        assert curr_data.get("update_available") is False
