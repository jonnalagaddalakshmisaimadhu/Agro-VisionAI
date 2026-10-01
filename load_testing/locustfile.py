import time
import random
from locust import HttpUser, task, between

# -----------------------------------------------------------------------------
# PHASE 6: HIGH-CONCURRENCY DISTRIBUTED LOAD TESTING WITH LOCUST.IO
# Simulates 10,000 to 100,000 concurrent moving drivers and route queries.
# -----------------------------------------------------------------------------

SAMPLE_COORDINATES = [
    {"lat": 16.4800, "lon": 80.6000, "name": "NH-16 Express Link"},
    {"lat": 16.3000, "lon": 80.4500, "name": "Guntur Mirchi Yard Link"},
    {"lat": 16.5100, "lon": 80.5200, "name": "SH-9 Amaravati Core"},
    {"lat": 16.5300, "lon": 80.6100, "name": "Krishna River Bypass"},
    {"lat": 16.2400, "lon": 80.6400, "name": "Tenali Rural Agri Link"}
]

class ConcurrentDriverUser(HttpUser):
    """
    Simulates real-world connected commercial vehicles transmitting
    continuous GPS telemetry and querying predictive corridor congestion.
    """
    wait_time = between(0.5, 2.0)

    def on_start(self):
        """Initializes unique vehicle session token."""
        self.vehicle_id = f"AP-07-TK-{random.randint(1000, 9999)}"
        self.current_idx = random.randint(0, len(SAMPLE_COORDINATES) - 1)

    @task(5)
    def send_gps_telemetry_ping(self):
        """Sends instantaneous GPS telemetry coordinate to Redis/FastAPI."""
        pt = SAMPLE_COORDINATES[self.current_idx]
        lat = pt["lat"] + random.uniform(-0.001, 0.001)
        lon = pt["lon"] + random.uniform(-0.001, 0.001)
        speed = random.uniform(35.0, 75.0)

        payload = {
            "vehicle_id": self.vehicle_id,
            "latitude": lat,
            "longitude": lon,
            "speed_kmh": round(speed, 1),
            "heading": random.uniform(0, 360),
            "battery_pct": 94,
            "status": "IN_TRANSIT"
        }
        self.client.post("/api/telemetry/ingest", json=payload, name="/api/telemetry/ingest")

    @task(3)
    def query_live_traffic_corridors(self):
        """Queries AI-predicted traffic corridor congestion."""
        self.client.get("/api/traffic/corridors", name="/api/traffic/corridors")

    @task(2)
    def query_route_navigation(self):
        """Queries turn-by-turn route calculation with spatial incidents check."""
        orig = SAMPLE_COORDINATES[0]
        dest = SAMPLE_COORDINATES[1]
        payload = {
            "origin_lat": orig["lat"],
            "origin_lon": orig["lon"],
            "dest_lat": dest["lat"],
            "dest_lon": dest["lon"],
            "vehicle_type": "TRUCK"
        }
        self.client.post("/api/navigation/route", json=payload, name="/api/navigation/route")

    @task(1)
    def send_stream_micro_batch(self):
        """Sends bundled micro-batch into Kafka/Faust stream processing."""
        pings = []
        for _ in range(3):
            pt = random.choice(SAMPLE_COORDINATES)
            pings.append({
                "vehicle_id": self.vehicle_id,
                "latitude": pt["lat"] + random.uniform(-0.0005, 0.0005),
                "longitude": pt["lon"] + random.uniform(-0.0005, 0.0005),
                "speed_kmh": random.uniform(40.0, 65.0),
                "timestamp": time.time()
            })
        self.client.post("/api/traffic/stream/batch", json={"batch": pings}, name="/api/traffic/stream/batch")
