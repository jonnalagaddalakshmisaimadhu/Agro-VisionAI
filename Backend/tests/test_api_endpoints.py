import pytest
import httpx
import time

BASE_URL = "http://localhost:8000"

@pytest.mark.asyncio
async def test_root_and_health():
    """Verify backend root and health check endpoints."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        r_root = await client.get("/")
        assert r_root.status_code == 200
        assert r_root.json().get("status") == "active"

        r_health = await client.get("/health")
        assert r_health.status_code == 200
        assert r_health.json().get("status") == "healthy"


@pytest.mark.asyncio
async def test_auth_registration_and_login():
    """Verify user registration, JWT generation, and /me profile retrieval."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        uname = f"farmer_test_{int(time.time())}"
        email = f"{uname}@farmiq.com"
        reg_payload = {
            "username": uname,
            "email": email,
            "password": "Password@123",
            "full_name": "Test Farmer QA"
        }
        r_reg = await client.post("/api/auth/register", json=reg_payload)
        assert r_reg.status_code == 200
        assert r_reg.json().get("username") == uname

        login_payload = {"username": uname, "password": "Password@123"}
        r_login = await client.post("/api/auth/login", json=login_payload)
        assert r_login.status_code == 200
        token = r_login.json().get("access_token")
        assert token is not None

        headers = {"Authorization": f"Bearer {token}"}
        r_me = await client.get("/api/auth/me", headers=headers)
        assert r_me.status_code == 200
        assert r_me.json().get("email") == email


@pytest.mark.asyncio
async def test_crop_recommendation_engine():
    """Verify mathematical agronomic crop recommendation engine."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        payload = {
            "location": "Guntur, Andhra Pradesh",
            "soil_type": "Black Soil",
            "farm_size": 3.0,
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


@pytest.mark.asyncio
async def test_disease_detection_vision():
    """Verify AI Vision crop disease classifier and remedies."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=20.0) as client:
        dummy_img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        payload = {"image_base64": dummy_img}
        r = await client.post("/api/disease/predict", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "disease_name" in data
        assert "confidence_score" in data


@pytest.mark.asyncio
async def test_weather_and_forecast():
    """Verify real-time Open-Meteo weather and agricultural advisories."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        r_curr = await client.get("/api/weather/current/Guntur")
        assert r_curr.status_code == 200
        assert "weather" in r_curr.json()

        r_fore = await client.get("/api/weather/forecast/Guntur")
        assert r_fore.status_code == 200
        assert "coordinates" in r_fore.json()


@pytest.mark.asyncio
async def test_government_schemes():
    """Verify government schemes catalog, categories, and states."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        r_schemes = await client.get("/api/schemes/schemes")
        assert r_schemes.status_code == 200
        assert len(r_schemes.json()) >= 5

        r_cats = await client.get("/api/schemes/categories")
        assert r_cats.status_code == 200


@pytest.mark.asyncio
async def test_equipment_rentals():
    """Verify equipment catalog with verified machinery listings."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        r = await client.get("/api/equipment")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 5


@pytest.mark.asyncio
async def test_app_update_checker():
    """Verify in-app auto-update version check endpoint."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        r = await client.get("/api/app/check-update?current_version=1.0.0")
        assert r.status_code == 200
        data = r.json()
        assert data.get("latest_version") == "1.0.1"
        assert data.get("update_available") is True


@pytest.mark.asyncio
async def test_marketplace_products():
    """Verify marketplace products and APMC market prices."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        r_prod = await client.get("/api/farm-market/products")
        assert r_prod.status_code == 200
        assert len(r_prod.json()) > 0

        r_prices = await client.get("/api/market-prices/prices/stats/summary")
        assert r_prices.status_code == 200


@pytest.mark.asyncio
async def test_ai_chatbot():
    """Verify 24/7 AI agricultural assistant chatbot."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        payload = {"message": "What is the best fertilizer for Paddy?", "language": "en"}
        r = await client.post("/api/chat", json=payload)
        assert r.status_code == 200
        assert len(r.json().get("response", "")) > 10
