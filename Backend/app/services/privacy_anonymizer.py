import math
import time
import hmac
import hashlib
import random
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

class LocationPrivacyEngine:
    """
    Enterprise Location Privacy & GPS Telemetry Anonymization Engine.
    Complies with India National Geospatial Policy (2022) & GDPR Art. 25 Privacy by Design.
    
    Mathematical Capabilities:
    1. Rotating HMAC-SHA256 Ephemeral Identity Pseudonymization (User ID Stripping).
    2. First/Last Mile Origin-Destination Obfuscation (Home/Farm 200m Masking).
    3. Epsilon-Differential Privacy Laplace Noise Injection for Public Corridor Feeds.
    """

    def __init__(self, master_salt: str = "farmiq_geospatial_privacy_salt_2026"):
        self.master_salt = master_salt
        self.mask_radius_meters = 200.0
        self.total_coordinates_anonymized = 0
        self.fuzzed_endpoints_count = 0

    @staticmethod
    def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes Great-Circle geodesic distance in meters."""
        R = 6371000.0
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0)**2
        return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    def generate_ephemeral_token(self, identifier: str, date_str: Optional[str] = None) -> str:
        """
        Derives an irreversible, daily-rotating cryptographic session token (HMAC-SHA256).
        Prevents correlation of trips across different days by third-party observers.
        """
        if not date_str:
            date_str = time.strftime("%Y-%m-%d")
        key = f"{self.master_salt}:{date_str}".encode("utf-8")
        token = hmac.new(key, identifier.encode("utf-8"), hashlib.sha256).hexdigest()
        return f"ANON-{token[:12].upper()}"

    def apply_first_last_mile_fuzzing(
        self,
        lat: float,
        lon: float,
        origin_lat: Optional[float] = None,
        origin_lon: Optional[float] = None,
        dest_lat: Optional[float] = None,
        dest_lon: Optional[float] = None
    ) -> Tuple[float, float, bool]:
        """
        Applies radial Gaussian/polar displacement if coordinate is within 200m of
        private home, farm, or terminal warehouse.
        """
        needs_fuzzing = False
        dist_to_origin = None
        dist_to_dest = None

        if origin_lat is not None and origin_lon is not None:
            dist_to_origin = self.haversine_meters(lat, lon, origin_lat, origin_lon)
            if dist_to_origin <= self.mask_radius_meters:
                needs_fuzzing = True

        if not needs_fuzzing and dest_lat is not None and dest_lon is not None:
            dist_to_dest = self.haversine_meters(lat, lon, dest_lat, dest_lon)
            if dist_to_dest <= self.mask_radius_meters:
                needs_fuzzing = True

        if not needs_fuzzing:
            return lat, lon, False

        # Apply polar displacement (random angle theta in [0, 2pi], radius r in [60, 200m])
        theta = random.uniform(0.0, 2.0 * math.pi)
        r = random.uniform(60.0, self.mask_radius_meters)

        m_per_deg_lat = 111132.954
        m_per_deg_lon = 111412.84 * math.cos(math.radians(lat))

        d_lat = (r * math.cos(theta)) / m_per_deg_lat
        d_lon = (r * math.sin(theta)) / m_per_deg_lon

        fuzzed_lat = round(lat + d_lat, 6)
        fuzzed_lon = round(lon + d_lon, 6)

        self.fuzzed_endpoints_count += 1
        return fuzzed_lat, fuzzed_lon, True

    def add_differential_privacy_noise(
        self,
        lat: float,
        lon: float,
        epsilon: float = 1.5
    ) -> Tuple[float, float]:
        """
        Adds calibrated Laplace noise for differential privacy on public statistics feeds:
        Noise ~ Laplace(0, b) where b = Sensitivity / epsilon
        """
        # Coordinate sensitivity in degrees (~5 meters = 0.000045 deg)
        sensitivity = 0.000045
        b = sensitivity / max(0.1, epsilon)

        # Generate Laplace sample using inverse CDF
        u1 = random.uniform(-0.5, 0.5)
        u2 = random.uniform(-0.5, 0.5)
        noise_lat = -b * math.copysign(1.0, u1) * math.log(1.0 - 2.0 * abs(u1))
        noise_lon = -b * math.copysign(1.0, u2) * math.log(1.0 - 2.0 * abs(u2))

        return round(lat + noise_lat, 6), round(lon + noise_lon, 6)

    def anonymize_telemetry_record(
        self,
        record: Optional[Dict[str, Any]] = None,
        raw_record: Optional[Dict[str, Any]] = None,
        identifier: Optional[str] = None,
        origin_lat: Optional[float] = None,
        origin_lon: Optional[float] = None,
        dest_lat: Optional[float] = None,
        dest_lon: Optional[float] = None,
        apply_dp: bool = False
    ) -> Dict[str, Any]:
        """
        Transforms an identified telemetry ping into a sanitized, compliant record:
        - Strips driver license/user ID -> Generates ephemeral session pseudonym
        - Obfuscates coordinates if near journey start/end points
        - Injects differential privacy if requested for external API broadcast
        """
        rec = record if record is not None else (raw_record or {})
        raw_vehicle_id = identifier or rec.get("vehicle_id", "UNKNOWN")
        ephemeral_id = self.generate_ephemeral_token(raw_vehicle_id)

        lat = float(rec.get("latitude", 0.0))
        lon = float(rec.get("longitude", 0.0))

        # First/Last Mile Fuzzing
        fuzzed_lat, fuzzed_lon, was_fuzzed = self.apply_first_last_mile_fuzzing(
            lat, lon, origin_lat, origin_lon, dest_lat, dest_lon
        )

        # Differential privacy noise
        if apply_dp:
            fuzzed_lat, fuzzed_lon = self.add_differential_privacy_noise(fuzzed_lat, fuzzed_lon)

        self.total_coordinates_anonymized += 1

        sanitized = {
            "ephemeral_session_token": ephemeral_id,
            "latitude": fuzzed_lat,
            "longitude": fuzzed_lon,
            "speed_kmh": rec.get("speed_kmh", 0.0),
            "heading": rec.get("heading", 0.0),
            "timestamp": rec.get("timestamp", time.time()),
            "privacy_compliance": {
                "user_id_stripped": True,
                "first_last_mile_masked": was_fuzzed,
                "differential_privacy_applied": apply_dp,
                "regulatory_framework": "India Geospatial 2022 / GDPR Art. 25"
            }
        }
        return sanitized


# Singleton instance
privacy_engine = LocationPrivacyEngine()
