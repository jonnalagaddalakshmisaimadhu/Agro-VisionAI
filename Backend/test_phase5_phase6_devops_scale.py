import time
from app.services.monitoring import devops_monitor
from app.services.scale_hardening import scale_hardening_service

def test_phase5_and_phase6():
    print("=" * 80)
    print("TESTING PHASE 5 (DEVOPS & K8S) AND PHASE 6 (HIGH SCALE HARDENING)")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # PHASE 5: DEVOPS & PROMETHEUS OBSERVABILITY
    # -------------------------------------------------------------------------
    print("\n[PHASE 5] 1. Verifying Prometheus Metrics Stream & Counters...")
    devops_monitor.record_http_request("GET", "/api/traffic/corridors", 200, 0.0035)
    devops_monitor.record_gps_ping(50)
    devops_monitor.record_batch_latency(0.0018)
    devops_monitor.record_ai_inference("XGBoost_PyTorch", 0.0005)

    raw_prom = devops_monitor.get_prometheus_metrics().decode("utf-8")
    assert "farmiq_http_requests_total" in raw_prom
    assert "farmiq_gps_pings_total" in raw_prom
    assert "farmiq_system_cpu_percent" in raw_prom
    print("-> Prometheus scrape bytes generated successfully! Metric series verified.")

    print("\n[PHASE 5] 2. Verifying Kubernetes / K3s Cluster Health Snapshot...")
    cluster_snap = devops_monitor.get_cluster_observability_snapshot()
    print(f"-> Distribution: {cluster_snap['kubernetes_cluster']['distribution']}")
    print(f"-> Active Pods: {cluster_snap['kubernetes_cluster']['pods_running']} (Failed: {cluster_snap['kubernetes_cluster']['pods_failed']})")
    print(f"-> HPA Policy: {cluster_snap['kubernetes_cluster']['hpa_status']}")
    print(f"-> Traefik Ingress: {cluster_snap['traefik_gateway']['version']} with TLS 1.3 auto-renewal")
    assert cluster_snap["status"] == "healthy"
    assert len(cluster_snap["pods"]) >= 6

    # -------------------------------------------------------------------------
    # PHASE 6: HIGH SCALE HARDENING & LOCUST STRESS TEST
    # -------------------------------------------------------------------------
    print("\n[PHASE 6] 3. Verifying Citus Sharded PostGIS Spatial Partitioning...")
    shards = scale_hardening_service.get_sharded_regions()
    print(f"-> Active Geographic Shards: {len(shards)}")
    for s in shards:
        print(f"   - {s['name']} (Shard #{s['shard_id']}): {s['records_count']} records | Query Latency: {s['avg_query_ms']}ms")
    assert len(shards) == 4

    print("\n[PHASE 6] 4. Testing Spatial Coordinate Shard Query Routing...")
    route_guntur = scale_hardening_service.route_coordinate_to_shard(16.30, 80.45)
    print(f"-> Coord (16.30, 80.45) routed to: {route_guntur['region_name']} (Shard #{route_guntur['target_shard_id']}) in {route_guntur['shard_routing_latency_ms']}ms")
    assert "Guntur" in route_guntur["region_name"]

    print("\n[PHASE 6] 5. Running 100,000 Virtual Concurrent Driver Locust Stress Test...")
    t0 = time.time()
    stress_res = scale_hardening_service.run_locust_load_simulation(concurrent_users=100000)
    duration = round(time.time() - t0, 3)
    print(f"-> Simulation finished in {duration}s:")
    print(f"   Peak Users: {stress_res['virtual_users_peak']:,}")
    print(f"   Throughput: {stress_res['requests_per_second']:,} req/sec")
    print(f"   Failure Rate: {stress_res['failure_rate_percent']}%")
    print(f"   Latency p50: {stress_res['latency_p50_ms']}ms | p95: {stress_res['latency_p95_ms']}ms | p99: {stress_res['latency_p99_ms']}ms")
    print(f"   Status: {stress_res['status']}")
    assert stress_res["failure_rate_percent"] == 0.0
    assert stress_res["latency_p95_ms"] < 25.0

    print("\n" + "=" * 80)
    print("ALL PHASE 5 & PHASE 6 DEVOPS & HARDENING TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    test_phase5_and_phase6()
