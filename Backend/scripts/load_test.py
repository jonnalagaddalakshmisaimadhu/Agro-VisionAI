"""
================================================================================
FARMIQ (AGRO-VISION AI) — HIGH-CONCURRENCY API LOAD & STRESS TESTING SUITE
================================================================================
Simulates concurrent user load against FastAPI in-process ASGI engine:
- Measures Latency (Min, Max, Avg, P95, P99)
- Measures Throughput (Requests / Second)
- Measures Error Rate and Connection Reliability
================================================================================
"""

import asyncio
import time
import sys
import statistics
from pathlib import Path

# Configure utf-8 encoding for Windows terminal
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import httpx
from main import app

ENDPOINTS = [
    ("GET", "/health", None),
    ("GET", "/api/schemes/schemes", None),
    ("GET", "/api/equipment", None),
    ("GET", "/api/farm-market/products", None),
    ("GET", "/api/soil?lat=16.3067&lon=80.4365", None),
    ("GET", "/api/app/check-update?current_version=1.0.0", None),
    ("POST", "/api/predict-soil", {"lat": 16.3067, "lon": 80.4365}),
]

CONCURRENT_USERS = 15
REQUESTS_PER_USER = 3
TOTAL_REQUESTS = CONCURRENT_USERS * REQUESTS_PER_USER

async def worker(worker_id: int, client: httpx.AsyncClient, results: list):
    for i in range(REQUESTS_PER_USER):
        method, path, body = ENDPOINTS[(worker_id + i) % len(ENDPOINTS)]
        start_time = time.perf_counter()
        try:
            if method == "GET":
                r = await client.get(path, timeout=10.0)
            else:
                r = await client.post(path, json=body, timeout=10.0)
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            results.append({
                "worker": worker_id,
                "path": path,
                "status": r.status_code,
                "latency_ms": elapsed_ms,
                "success": r.status_code < 400
            })
        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            results.append({
                "worker": worker_id,
                "path": path,
                "status": 500,
                "latency_ms": elapsed_ms,
                "success": False,
                "error": str(e)
            })

async def run_load_test():
    print("=" * 80)
    print("   🚀 STARTING FARMIQ HIGH-CONCURRENCY ASYNC LOAD & STRESS TEST")
    print("=" * 80)
    print(f"   Concurrent Workers : {CONCURRENT_USERS}")
    print(f"   Requests per Worker: {REQUESTS_PER_USER}")
    print(f"   Total Test Requests: {TOTAL_REQUESTS}")
    print("=" * 80)

    transport = httpx.ASGITransport(app=app)
    results = []
    
    overall_start = time.perf_counter()
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        tasks = [worker(i, client, results) for i in range(CONCURRENT_USERS)]
        await asyncio.gather(*tasks)
    
    total_time = time.perf_counter() - overall_start

    # Metrics
    latencies = [r["latency_ms"] for r in results]
    successes = sum(1 for r in results if r["success"])
    failures = len(results) - successes
    req_per_sec = len(results) / total_time if total_time > 0 else 0

    sorted_lat = sorted(latencies)
    p50 = statistics.median(latencies) if latencies else 0
    p95 = sorted_lat[int(len(sorted_lat) * 0.95)] if latencies else 0
    p99 = sorted_lat[int(len(sorted_lat) * 0.99)] if latencies else 0
    min_lat = min(latencies) if latencies else 0
    max_lat = max(latencies) if latencies else 0
    avg_lat = statistics.mean(latencies) if latencies else 0

    print("\n📊 LOAD & STRESS TEST RESULTS:")
    print("-" * 80)
    print(f"   Total Requests Executed  : {len(results)}")
    print(f"   Successful (HTTP 2xx/3xx): {successes} ({successes / len(results) * 100:.1f}%)")
    print(f"   Failed (HTTP 4xx/5xx)    : {failures} ({failures / len(results) * 100:.1f}%)")
    print(f"   Total Test Duration      : {total_time:.2f}s")
    print(f"   Throughput               : {req_per_sec:.2f} req/sec")
    print("-" * 80)
    print(f"   Min Latency              : {min_lat:.2f} ms")
    print(f"   Avg Latency              : {avg_lat:.2f} ms")
    print(f"   Median (P50) Latency     : {p50:.2f} ms")
    print(f"   P95 Latency              : {p95:.2f} ms")
    print(f"   P99 Latency              : {p99:.2f} ms")
    print(f"   Max Latency              : {max_lat:.2f} ms")
    print("=" * 80)
    if failures == 0 and p95 < 1500:
        print("   ✅ STATUS: LOAD & STRESS TEST 100% PASSED (Performance Certified)")
    else:
        print("   ⚠️ STATUS: PERFORMANCE THRESHOLD COMPLETED WITH WARNINGS")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_load_test())
