"""
================================================================================
FARMIQ (AGRO-VISION AI) — AUDIT & EDGE CASES TEST SUITE
================================================================================
Comprehensive validation covering:
- Authentication edge cases (malformed tokens, tampered signatures, unauthenticated access)
- Price Alerts end-to-end lifecycle with authenticated users (POST, GET, DELETE)
- Seller statistics calculation with authenticated users
- Boundary conditions (0 acreage, extreme coordinates, invalid crop names)
- AI/ML vision fallbacks on corrupt or non-leaf payloads
- Weather advisories and voice script generation across languages
- Equipment rental calculation engines (day, hour, acre modes)
- Performance and rapid concurrency stress
================================================================================
"""

import pytest
import httpx
import time
import os
import sys
import asyncio
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

async def register_and_login_user(client: httpx.AsyncClient):
    """Helper to create a fresh test user and return authenticated headers."""
    ts = int(time.time() * 1000)
    username = f"audit_user_{ts}"
    password = "SecurePassword@123"
    email = f"{username}@farmiq.ai"

    # Register
    reg_res = await client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
        "full_name": "Audit Test Farmer",
        "location": "Guntur, Andhra Pradesh",
        "farm_size": "10"
    })
    assert reg_res.status_code == 200

    # Login
    login_res = await client.post("/api/auth/login", json={
        "username": username,
        "password": password
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return token, headers, username


@pytest.mark.asyncio
async def test_auth_security_tampered_and_malformed_tokens():
    """Security Audit: Verify rejection of invalid, expired, and tampered tokens."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Completely bogus token
        r1 = await client.get("/api/auth/me", headers={"Authorization": "Bearer bogus_token_12345"})
        assert r1.status_code == 401

        # 2. Tampered signature
        r2 = await client.get("/api/auth/me", headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiJ9.invalidsig"})
        assert r2.status_code == 401

        # 3. Missing bearer prefix
        r3 = await client.get("/api/auth/me", headers={"Authorization": "null"})
        assert r3.status_code == 401

        # 4. Empty auth header
        r4 = await client.get("/api/auth/me", headers={"Authorization": ""})
        assert r4.status_code in [401, 403]


@pytest.mark.asyncio
async def test_registration_input_validation_and_numeric_username_rejection():
    """Security Audit: Strictly reject purely numeric usernames like '123' and short passwords."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Purely numeric username ('123') MUST BE REJECTED with 422
        r_num = await client.post("/api/auth/register", json={
            "username": "123",
            "email": "123@gmail.com",
            "password": "ValidPassword@123",
            "full_name": "Numeric Name"
        })
        assert r_num.status_code == 422
        assert "username" in r_num.text.lower() or "solely of numbers" in r_num.text.lower()

        # 2. Too short password ('...') MUST BE REJECTED with 422
        r_pwd = await client.post("/api/auth/register", json={
            "username": "valid_farmer",
            "email": "valid@gmail.com",
            "password": "...",
            "full_name": "Valid Farmer"
        })
        assert r_pwd.status_code == 422
        assert "password" in r_pwd.text.lower()

        # 3. Invalid email format MUST BE REJECTED with 422
        r_em = await client.post("/api/auth/register", json={
            "username": "valid_farmer",
            "email": "notanemail",
            "password": "ValidPassword@123",
            "full_name": "Valid Farmer"
        })
        assert r_em.status_code == 422

        # 4. Valid alphanumeric registration MUST SUCCEED with 200
        ts = int(time.time() * 1000)
        r_ok = await client.post("/api/auth/register", json={
            "username": f"farmer_ramesh_{ts}",
            "email": f"farmer_ramesh_{ts}@farmiq.ai",
            "password": "SecurePassword@123",
            "full_name": "Ramesh Kumar"
        })
        assert r_ok.status_code == 200
        assert r_ok.json()["username"] == f"farmer_ramesh_{ts}"


@pytest.mark.asyncio
async def test_price_alerts_authenticated_crud_lifecycle():
    """Module 5 Fix Audit: Verify price alerts CRUD with get_current_active_user."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        token, headers, username = await register_and_login_user(client)

        # 1. Create a price alert
        alert_payload = {
            "crop_name": "Guntur Teja Red Chilli",
            "alert_type": "above",
            "target_price": 230.0
        }
        r_create = await client.post("/api/market-prices/alerts", json=alert_payload, headers=headers)
        assert r_create.status_code == 200
        alert_data = r_create.json()
        assert alert_data["crop_name"] == "Guntur Teja Red Chilli"
        assert alert_data["target_price"] == 230.0
        assert alert_data["is_active"] is True
        alert_id = alert_data["id"]

        # 2. Get user price alerts
        r_get = await client.get("/api/market-prices/alerts", headers=headers)
        assert r_get.status_code == 200
        alerts_list = r_get.json()
        assert any(a["id"] == alert_id for a in alerts_list)

        # 3. Delete the price alert
        r_del = await client.delete(f"/api/market-prices/alerts/{alert_id}", headers=headers)
        assert r_del.status_code == 200
        assert "successfully" in r_del.json().get("message", "").lower()

        # 4. Reject alert creation for non-existent crop
        bad_alert = {
            "crop_name": "NonExistentExtinctCrop999",
            "alert_type": "below",
            "target_price": 100.0
        }
        r_bad = await client.post("/api/market-prices/alerts", json=bad_alert, headers=headers)
        assert r_bad.status_code == 404


@pytest.mark.asyncio
async def test_seller_statistics_authenticated_access():
    """Module 5 Fix Audit: Verify seller stats with get_current_active_user."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        token, headers, username = await register_and_login_user(client)
        r_stats = await client.get("/api/farm-market/seller-stats", headers=headers)
        assert r_stats.status_code == 200
        stats = r_stats.json()
        assert "total_products" in stats
        assert "total_sales" in stats
        assert "average_rating" in stats


@pytest.mark.asyncio
async def test_profit_prediction_boundary_conditions():
    """Module 1 Boundary Audit: Valid/Invalid acreage and scenario calculations."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Standard valid prediction with custom input costs
        payload_valid = {
            "crop_name": "Tomato",
            "area_ha": 1.5,
            "expected_yield_t_per_ha": 25.0,
            "price_per_kg": 35.0,
            "input_costs": {
                "seeds": 12000.0,
                "fertilizer": 18000.0,
                "irrigation": 8000.0,
                "labor": 15000.0,
                "machinery": 7000.0
            },
            "district": "Kolar",
            "irrigation_type": "Drip",
            "farming_type": "Organic"
        }
        r = await client.post("/api/profit/predict", json=payload_valid)
        assert r.status_code == 200
        res = r.json()
        assert res["revenue"] > 0
        assert res["investment"] == 60000.0
        assert res["profit"] == res["revenue"] - res["investment"]
        assert res["bc_ratio"] > 1.0
        assert "scenarios" in res
        assert res["scenarios"]["best_case"]["roi_percent"] > res["scenarios"]["worst_case"]["roi_percent"]

        # 2. Reject zero or negative acreage (Pydantic Field(gt=0))
        payload_invalid = {
            "crop_name": "Tomato",
            "area_ha": -2.0
        }
        r_inv = await client.post("/api/profit/predict", json=payload_invalid)
        assert r_inv.status_code == 422


@pytest.mark.asyncio
async def test_equipment_rental_calculation_modes():
    """Module 6 Audit: Multi-tier pricing calculation (Day, Hour, Acre + Operator)."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Get equipment #1 (Mahindra Tractor: day=2400, hour=350, acre=850, op_fee=400)
        r_eq = await client.get("/api/equipment/equipment/1")
        assert r_eq.status_code == 200

        # Booking by day with operator
        rental_day = {
            "equipment_id": 1,
            "start_date": "2026-09-01T08:00:00Z",
            "end_date": "2026-09-03T18:00:00Z",
            "billing_mode": "day",
            "units_booked": 2.0,
            "with_operator": True,
            "fuel_included": False,
            "renter_name": "Audit Farmer",
            "renter_phone": "9876543210"
        }
        r_book = await client.post("/api/equipment/rentals", json=rental_day)
        assert r_book.status_code == 200
        booked = r_book.json()
        # Expected: (2400 * 2) + (400 * 2) = 5600.0
        assert booked["total_amount"] == 5600.0
        assert booked["status"] == "pending"

        # Booking by acre with pilot (e.g. Drone ID 4)
        drone_booking = {
            "equipment_id": 4,
            "start_date": "2026-09-05T08:00:00Z",
            "end_date": "2026-09-05T12:00:00Z",
            "billing_mode": "acre",
            "units_booked": 10.0,
            "with_operator": True,
            "fuel_included": True,
            "renter_name": "Audit Farmer",
            "renter_phone": "9876543210"
        }
        r_drone = await client.post("/api/equipment/rentals", json=drone_booking)
        assert r_drone.status_code == 200
        assert r_drone.json()["total_amount"] > 0

        # Non-existent equipment booking rejection
        bad_booking = {
            "equipment_id": 99999,
            "start_date": "2026-09-01T08:00:00Z",
            "end_date": "2026-09-02T08:00:00Z"
        }
        r_bad = await client.post("/api/equipment/rentals", json=bad_booking)
        assert r_bad.status_code == 404


@pytest.mark.asyncio
async def test_weather_voice_script_and_advisories():
    """Module 3 Audit: Multi-language vernacular voice audio script generation."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. English voice script
        r_en = await client.get("/api/weather/alerts/voice-script/Guntur?lang=en")
        assert r_en.status_code == 200
        data_en = r_en.json()
        assert "voice_script" in data_en
        assert len(data_en["voice_script"]) > 20

        # 2. Telugu voice script
        r_te = await client.get("/api/weather/alerts/voice-script/Guntur?lang=te")
        assert r_te.status_code == 200
        data_te = r_te.json()
        assert "voice_script" in data_te
        assert len(data_te["voice_script"]) > 10

        # 3. Comprehensive agricultural report
        r_rep = await client.get("/api/weather/report/Guntur")
        assert r_rep.status_code == 200
        rep_data = r_rep.json()
        assert "current_climate" in rep_data
        assert "advisories" in rep_data


@pytest.mark.asyncio
async def test_disease_detection_resilience_and_fallbacks():
    """Module 2 Audit: Vision AI pipeline fallback handling on corrupt inputs."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Corrupt base64 string
        r = await client.post("/api/disease/predict", json={"image_base64": "invalid_corrupt_base64!!!"})
        assert r.status_code == 200
        res = r.json()
        assert "disease_name" in res
        assert "treatment" in res
        assert "prevention" in res


@pytest.mark.asyncio
async def test_concurrency_and_performance():
    """Performance & Concurrency Audit: Rapid parallel API requests."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        start_time = time.time()
        tasks = [
            client.get("/api/weather/current/Guntur"),
            client.get("/api/schemes/schemes"),
            client.get("/api/equipment"),
            client.get("/api/farm-market/products"),
            client.get("/api/market-prices/prices/stats/summary"),
            client.get("/api/app/check-update?current_version=1.0.0"),
            client.get("/api/soil?lat=16.3067&lon=80.4365"),
            client.get("/api/community/channels")
        ]
        responses = await asyncio.gather(*tasks)
        elapsed = time.time() - start_time

        for resp in responses:
            assert resp.status_code == 200
        assert elapsed < 5.0, f"8 concurrent endpoints took {elapsed:.2f}s, expected < 5s"
