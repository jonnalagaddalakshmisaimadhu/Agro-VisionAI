import asyncio
import time
from app.services.map_matching import map_matching_engine
from app.services.traffic_prediction_engine import traffic_prediction_engine
from app.services.stream_processing import stream_processor

def test_phase4_components():
    print("=" * 80)
    print("PHASE 4: TESTING STREAM PROCESSING & AI/ML TRAFFIC PREDICTION")
    print("=" * 80)

    # 1. Map Matching
    print("\n[STEP 1] Testing Road Link Map-Matching Engine...")
    raw_lat, raw_lon = 16.4805, 80.6012  # Point slightly offset from NH-16
    match = map_matching_engine.match_coordinate(raw_lat, raw_lon, speed_kmh=68.0, heading=210.0)
    print(f"-> Raw GPS: ({raw_lat}, {raw_lon})")
    print(f"-> Snapped To: {match['road_name']} ({match['link_id']})")
    print(f"-> Snapped Coords: {match['snapped_coordinates']}")
    print(f"-> Cross-track error: {match['distance_offset_meters']}m | Confidence: {match['confidence']}")
    assert match["matched"] is True
    assert match["distance_offset_meters"] < 250

    # 2. AI/ML Traffic Prediction (XGBoost + PyTorch GNN)
    print("\n[STEP 2] Testing Dual-Engine AI/ML Traffic Prediction...")
    link_id = "LINK-NH16-01"
    
    # Test Normal Free-Flow Condition
    pred_normal = traffic_prediction_engine.predict_link_speed(
        link_id=link_id,
        hour=14,  # 2 PM
        day=2,   # Wednesday
        weather_severity=0.0,
        rainfall_mm=0.0,
        market_rush_index=0.1,
        current_speed=72.0,
        speed_limit=80.0,
        lead_time_minutes=15
    )
    print("-> Normal Conditions (15 min horizon):")
    print(f"   Speed: {pred_normal['predicted_speed_kmh']} km/h | Status: {pred_normal['congestion_level']} | Engine: {pred_normal['engine']}")

    # Test Monsoon Downpour + Rush Hour Condition
    pred_storm = traffic_prediction_engine.predict_link_speed(
        link_id=link_id,
        hour=18,  # 6 PM Rush
        day=4,   # Friday
        weather_severity=0.85,  # Heavy Monsoon
        rainfall_mm=45.0,
        market_rush_index=0.8,
        current_speed=35.0,
        speed_limit=80.0,
        lead_time_minutes=30
    )
    print("-> Monsoon Storm + Rush Hour (30 min horizon):")
    print(f"   Speed: {pred_storm['predicted_speed_kmh']} km/h | Status: {pred_storm['congestion_level']} | Delay/10km: {pred_storm['delay_per_10km_minutes']} min")
    assert pred_storm["predicted_speed_kmh"] < pred_normal["predicted_speed_kmh"]
    assert pred_storm["congestion_index"] > pred_normal["congestion_index"]

    # 3. Stream Micro-Batch Ingestion
    print("\n[STEP 3] Testing High-Frequency Stream Batch Ingestion...")
    batch = [
        {"vehicle_id": "AP-07-TK-1001", "latitude": 16.4800, "longitude": 80.6000, "speed_kmh": 62.0, "heading": 215.0},
        {"vehicle_id": "AP-07-TK-1002", "latitude": 16.4502, "longitude": 80.5801, "speed_kmh": 58.5, "heading": 212.0},
        {"vehicle_id": "AP-07-TK-1003", "latitude": 16.3005, "longitude": 80.4508, "speed_kmh": 32.0, "heading": 120.0},
    ]
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    res = loop.run_until_complete(stream_processor.ingest_batch(batch))
    print(f"-> Micro-batch processed: {res['events_count']} events in {res['processing_latency_ms']}ms")
    assert res["status"] == "success"

    # 4. Monitored Corridors & Metrics
    print("\n[STEP 4] Verifying Monitored Corridors and Stream Health...")
    corridors = stream_processor.get_corridor_states()
    metrics = stream_processor.get_stream_metrics()
    print(f"-> Total Monitored Corridors: {len(corridors)}")
    for c in corridors[:3]:
        print(f"   - {c['name']}: {c['current_speed_kmh']} km/h ({c['congestion_level']}) | 15m FC: {c['forecast_15m']} km/h")
    print(f"-> Stream Metrics: Ingested={metrics['total_events_ingested']}, Batches={metrics['total_batches_processed']}, Broker={metrics['kafka_broker_status']}")

    print("\n" + "=" * 80)
    print("ALL PHASE 4 BACKEND STREAM & AI PREDICTION TESTS PASSED!")
    print("=" * 80)

if __name__ == "__main__":
    test_phase4_components()
