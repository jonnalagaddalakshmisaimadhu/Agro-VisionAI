import sys
from pathlib import Path
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

def test_api_endpoints():
    print("Testing Live FastAPI Security Endpoints...")
    
    # 1. Test /api/security/audit-status
    res = client.get("/api/security/audit-status")
    assert res.status_code == 200, f"Expected 200 got {res.status_code}"
    data = res.json()
    assert data["security_posture"] == "ENTERPRISE_HARDENED"
    assert len(data["compliance_certifications"]) >= 4
    print("  [PASS] GET /api/security/audit-status -> 200 OK")

    # 2. Test /api/security/anonymize
    payload = {
        "latitude": 17.3850,
        "longitude": 78.4867,
        "vehicle_id": "AP-09-TRIP-9988",
        "speed_kmh": 52.0,
        "origin_lat": 17.3840,
        "origin_lon": 78.4850,
        "apply_dp": True
    }
    res = client.post("/api/security/anonymize", json=payload)
    assert res.status_code == 200, f"Expected 200 got {res.status_code}: {res.text}"
    anon_data = res.json()
    assert anon_data["ephemeral_session_token"].startswith("ANON-")
    assert "privacy_compliance" in anon_data
    print("  [PASS] POST /api/security/anonymize -> 200 OK")

    # 3. Test /api/security/waf-metrics
    res = client.get("/api/security/waf-metrics")
    assert res.status_code == 200
    print("  [PASS] GET /api/security/waf-metrics -> 200 OK")

    # 4. Test /api/security/audit-logs
    res = client.get("/api/security/audit-logs?limit=5")
    assert res.status_code == 200
    assert len(res.json()["audit_trail"]) >= 1
    print("  [PASS] GET /api/security/audit-logs -> 200 OK")

    # 5. Test WAF Blocking of Malicious Request (SQL Injection Query Parameter)
    res_blocked = client.get("/api/crops?query=UNION+SELECT+*+FROM+passwords--")
    assert res_blocked.status_code == 403, f"Expected 403 Forbidden from WAF, got {res_blocked.status_code}"
    assert "Forbidden" in res_blocked.json()["error"]
    print(f"  [PASS] WAF blocked SQL Injection query param -> HTTP 403 Forbidden ({res_blocked.json()['reason']})")

    # 6. Test WAF Blocking of Malicious User-Agent
    res_agent = client.get("/health", headers={"User-Agent": "sqlmap/1.4.11#stable"})
    assert res_agent.status_code == 403, f"Expected 403 Forbidden for scanner agent, got {res_agent.status_code}"
    print("  [PASS] WAF blocked automated scanner User-Agent (sqlmap) -> HTTP 403 Forbidden")

    # 7. Test /api/security/vault/rotate
    res = client.post("/api/security/vault/rotate", json={"lease_id": "database/creds/farmiq-role-3j9a"})
    assert res.status_code == 200
    assert res.json()["action"] == "DYNAMIC_LEASE_ROTATED"
    print("  [PASS] POST /api/security/vault/rotate -> 200 OK")

    print("\nALL FASTAPI SECURITY ENDPOINTS & WAF POLICIES VERIFIED!")

if __name__ == "__main__":
    test_api_endpoints()
