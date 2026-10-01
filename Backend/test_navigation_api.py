import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_navigation_flow():
    print("--- 1. Testing Route Calculation & Corridor Incident Matching ---")
    route_payload = {
        "origin": {"lat": 16.3067, "lon": 80.4365, "name": "Guntur Agri Hub"},
        "destination": {"lat": 16.5062, "lon": 80.6480, "name": "Vijayawada Wholesale Terminal"},
        "profile": "driving"
    }
    res = client.post("/api/navigation/route", json=route_payload)
    assert res.status_code == 200, f"Route calculation failed: {res.text}"
    route_data = res.json()
    print(f"Routing Engine Source: {route_data.get('routing_engine')}")
    print(f"Distance: {route_data.get('distance_km')} km | Base ETA: {route_data.get('base_duration_minutes')} min")
    print(f"Corridor Hazards Detected: {len(route_data.get('corridor_hazards', []))}")
    print(f"Adjusted ETA with Hazard Delays: {route_data.get('adjusted_duration_minutes')} min")
    print(f"Turn Steps Count: {len(route_data.get('steps', []))}")

    print("\n--- 2. Testing Spatial Incidents API ---")
    inc_res = client.get("/api/navigation/incidents?lat=16.4410&lon=80.5620&radius_km=15")
    assert inc_res.status_code == 200, f"Incidents query failed: {inc_res.text}"
    incidents = inc_res.json()
    print(f"Proximity Incidents Found: {len(incidents.get('incidents', []))}")

    print("\n--- 3. Testing Trip Lifecycle (Start & Complete) ---")
    trip_payload = {
        "origin": route_payload["origin"],
        "destination": route_payload["destination"],
        "distance_km": route_data.get("distance_km", 34.5),
        "duration_minutes": route_data.get("adjusted_duration_minutes", 45.0),
        "route_polyline": route_data.get("polyline", [])[:5],
        "user_email": "farmer.test@farmiq.ai"
    }
    trip_start_res = client.post("/api/navigation/trips/start", json=trip_payload)
    assert trip_start_res.status_code in [200, 201], f"Trip start failed: {trip_start_res.text}"
    trip_id = trip_start_res.json()["trip_id"]
    print(f"Trip Started successfully! Trip ID: {trip_id}, Status: {trip_start_res.json()['status']}")

    trip_complete_res = client.put(f"/api/navigation/trips/{trip_id}/complete")
    assert trip_complete_res.status_code == 200, f"Trip complete failed: {trip_complete_res.text}"
    print(f"Trip Completed successfully! Status: {trip_complete_res.json()['status']}")

    print("\n>>> ALL PHASE 1 NAVIGATION & ROUTING ENDPOINTS VERIFIED 100% WORKING! <<<")

if __name__ == "__main__":
    test_navigation_flow()
