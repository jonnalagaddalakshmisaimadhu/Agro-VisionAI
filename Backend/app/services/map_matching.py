import math
import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# OPENSTREETMAP ROAD LINK NETWORK DEFINITION
# -----------------------------------------------------------------------------
DEFAULT_ROAD_LINKS = [
    {
        "link_id": "LINK-NH16-01",
        "name": "NH-16 Express Corridor (Vijayawada - Guntur)",
        "road_type": "HIGHWAY",
        "speed_limit_kmh": 80.0,
        "lanes": 6,
        "length_km": 14.5,
        "coordinates": [
            [16.4800, 80.6000],
            [16.4500, 80.5800],
            [16.4100, 80.5600],
            [16.3700, 80.5400],
            [16.3300, 80.5200],
            [16.3000, 80.5000]
        ]
    },
    {
        "link_id": "LINK-MKT-02",
        "name": "Guntur Mirchi Yard & Mandi Access Highway",
        "road_type": "ARTERIAL",
        "speed_limit_kmh": 50.0,
        "lanes": 4,
        "length_km": 8.2,
        "coordinates": [
            [16.3000, 80.4500],
            [16.2950, 80.4650],
            [16.2880, 80.4800],
            [16.2800, 80.4950],
            [16.2750, 80.5100]
        ]
    },
    {
        "link_id": "LINK-SH9-03",
        "name": "SH-9 Amaravati Core Capital Link",
        "road_type": "PRIMARY",
        "speed_limit_kmh": 65.0,
        "lanes": 4,
        "length_km": 11.0,
        "coordinates": [
            [16.5100, 80.5200],
            [16.4950, 80.5350],
            [16.4700, 80.5500],
            [16.4400, 80.5650]
        ]
    },
    {
        "link_id": "LINK-AGRI-04",
        "name": "Krishna River Cold Storage Transit Bypass",
        "road_type": "SECONDARY",
        "speed_limit_kmh": 55.0,
        "lanes": 2,
        "length_km": 9.4,
        "coordinates": [
            [16.5300, 80.6100],
            [16.5150, 80.6300],
            [16.4950, 80.6500],
            [16.4700, 80.6700]
        ]
    },
    {
        "link_id": "LINK-RUR-05",
        "name": "Tenali Rural Agri-Feed Bypass",
        "road_type": "RURAL_LINK",
        "speed_limit_kmh": 40.0,
        "lanes": 2,
        "length_km": 6.8,
        "coordinates": [
            [16.2400, 80.6400],
            [16.2300, 80.6550],
            [16.2150, 80.6700],
            [16.2000, 80.6850]
        ]
    },
    {
        "link_id": "LINK-ORR-06",
        "name": "Outer Ring Road Heavy Logistics Arterial",
        "road_type": "EXPRESSWAY",
        "speed_limit_kmh": 90.0,
        "lanes": 6,
        "length_km": 18.0,
        "coordinates": [
            [16.5500, 80.5000],
            [16.5200, 80.4600],
            [16.4800, 80.4300],
            [16.4200, 80.4200],
            [16.3600, 80.4400]
        ]
    }
]


class MapMatchingEngine:
    """
    Industrial Road Link Map-Matching Engine.
    Snaps noisy raw GPS telemetry breadcrumbs to OpenStreetMap road link segments.
    Filters GPS jitter using cross-track geometric projection and heading alignment.
    """

    def __init__(self, road_links: Optional[List[Dict[str, Any]]] = None):
        self.road_links = road_links or DEFAULT_ROAD_LINKS
        self._precompute_segments()

    def _precompute_segments(self):
        """Precomputes segment bearings and bounding boxes for fast spatial indexing."""
        self.segments = []
        for link in self.road_links:
            coords = link["coordinates"]
            for i in range(len(coords) - 1):
                p1 = coords[i]
                p2 = coords[i + 1]
                bearing = self.calculate_bearing(p1[0], p1[1], p2[0], p2[1])
                seg_len = self.haversine_meters(p1[0], p1[1], p2[0], p2[1])
                self.segments.append({
                    "link_id": link["link_id"],
                    "road_name": link["name"],
                    "road_type": link["road_type"],
                    "speed_limit_kmh": link["speed_limit_kmh"],
                    "p1": p1,
                    "p2": p2,
                    "bearing": bearing,
                    "length_m": seg_len,
                    "min_lat": min(p1[0], p2[0]) - 0.005,
                    "max_lat": max(p1[0], p2[0]) + 0.005,
                    "min_lon": min(p1[1], p2[1]) - 0.005,
                    "max_lon": max(p1[1], p2[1]) + 0.005
                })

    @staticmethod
    def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes distance between two geographic coordinates in meters."""
        R = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    @staticmethod
    def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates forward compass azimuth from point 1 to point 2 (0-360 degrees)."""
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_lambda = math.radians(lon2 - lon1)

        y = math.sin(delta_lambda) * math.cos(phi2)
        x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
        theta = math.atan2(y, x)
        return (math.degrees(theta) + 360.0) % 360.0

    def project_point_to_segment(
        self,
        lat: float,
        lon: float,
        p1: List[float],
        p2: List[float]
    ) -> Tuple[float, float, float]:
        """
        Projects point (lat, lon) orthogonally onto segment (p1 -> p2).
        Returns: (projected_lat, projected_lon, cross_track_distance_meters)
        """
        # Linear approximation for local flat projection (accurate within sub-meter for short segments)
        lat1, lon1 = p1[0], p1[1]
        lat2, lon2 = p2[0], p2[1]

        # Convert to local Cartesian offsets in meters
        mid_lat = (lat1 + lat2 + lat) / 3.0
        m_per_deg_lat = 111132.954
        m_per_deg_lon = 111412.84 * math.cos(math.radians(mid_lat))

        x = (lon - lon1) * m_per_deg_lon
        y = (lat - lat1) * m_per_deg_lat

        dx = (lon2 - lon1) * m_per_deg_lon
        dy = (lat2 - lat1) * m_per_deg_lat

        seg_len_sq = dx * dx + dy * dy
        if seg_len_sq == 0:
            dist = math.sqrt(x * x + y * y)
            return lat1, lon1, dist

        # Projection factor t clamped between 0.0 and 1.0 (clamped segment projection)
        t = max(0.0, min(1.0, (x * dx + y * dy) / seg_len_sq))

        proj_x = t * dx
        proj_y = t * dy

        # Perpendicular cross-track error
        dist = math.sqrt((x - proj_x) ** 2 + (y - proj_y) ** 2)

        # Convert projected point back to lat/lon
        proj_lat = lat1 + (proj_y / m_per_deg_lat)
        proj_lon = lon1 + (proj_x / m_per_deg_lon)

        return proj_lat, proj_lon, dist

    def match_coordinate(
        self,
        lat: float,
        lon: float,
        heading: Optional[float] = None,
        speed_kmh: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Snaps a single noisy GPS coordinate to the most likely road link.
        Calculates cross-track distance, heading difference, and confidence score.
        """
        best_match = None
        min_cost = float("inf")

        for seg in self.segments:
            # Spatial bounding box quick rejection
            if not (seg["min_lat"] <= lat <= seg["max_lat"] and seg["min_lon"] <= lon <= seg["max_lon"]):
                continue

            proj_lat, proj_lon, dist_m = self.project_point_to_segment(lat, lon, seg["p1"], seg["p2"])

            # Cost formulation: combination of distance error (m) and heading alignment penalty
            cost = dist_m
            heading_diff = 0.0
            if heading is not None and speed_kmh and speed_kmh > 5.0:
                diff = abs(heading - seg["bearing"])
                if diff > 180.0:
                    diff = 360.0 - diff
                heading_diff = diff
                # Penalize opposite direction or perpendicular alignment
                cost += (heading_diff / 10.0) * 2.0

            if cost < min_cost:
                min_cost = cost
                # Confidence score: 1.0 at 0m, drops exponentially with distance
                confidence = max(0.05, min(0.99, math.exp(-0.04 * dist_m)))
                best_match = {
                    "matched": True,
                    "link_id": seg["link_id"],
                    "road_name": seg["road_name"],
                    "road_type": seg["road_type"],
                    "speed_limit_kmh": seg["speed_limit_kmh"],
                    "raw_coordinates": [round(lat, 6), round(lon, 6)],
                    "snapped_coordinates": [round(proj_lat, 6), round(proj_lon, 6)],
                    "distance_offset_meters": round(dist_m, 2),
                    "segment_bearing": round(seg["bearing"], 1),
                    "heading_diff": round(heading_diff, 1),
                    "confidence": round(confidence, 3)
                }

        # Fallback if beyond bounding boxes of known road links:
        # Find nearest segment globally without bbox constraint
        if not best_match:
            for seg in self.segments:
                proj_lat, proj_lon, dist_m = self.project_point_to_segment(lat, lon, seg["p1"], seg["p2"])
                if dist_m < min_cost:
                    min_cost = dist_m
                    confidence = max(0.01, min(0.95, math.exp(-0.04 * dist_m)))
                    best_match = {
                        "matched": True,
                        "link_id": seg["link_id"],
                        "road_name": seg["road_name"],
                        "road_type": seg["road_type"],
                        "speed_limit_kmh": seg["speed_limit_kmh"],
                        "raw_coordinates": [round(lat, 6), round(lon, 6)],
                        "snapped_coordinates": [round(proj_lat, 6), round(proj_lon, 6)],
                        "distance_offset_meters": round(dist_m, 2),
                        "segment_bearing": round(seg["bearing"], 1),
                        "heading_diff": 0.0,
                        "confidence": round(confidence, 3)
                    }

        return best_match or {
            "matched": False,
            "raw_coordinates": [lat, lon],
            "snapped_coordinates": [lat, lon],
            "distance_offset_meters": 0.0,
            "confidence": 0.1
        }

    def match_trajectory(self, breadcrumbs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Snaps a sequence of GPS breadcrumbs with trajectory smoothing.
        Filters out GPS jitter spikes (> 120 km/h impossible rural jump).
        """
        matched_results = []
        last_valid_pt = None

        for item in breadcrumbs:
            lat = float(item.get("latitude", 0.0))
            lon = float(item.get("longitude", 0.0))
            heading = float(item.get("heading", 0.0)) if "heading" in item else None
            speed = float(item.get("speed_kmh", 0.0)) if "speed_kmh" in item else None

            # Jitter threshold check
            if last_valid_pt:
                dt_sec = max(0.5, item.get("timestamp", 0) - last_valid_pt.get("timestamp", 0))
                jump_dist = self.haversine_meters(last_valid_pt["lat"], last_valid_pt["lon"], lat, lon)
                apparent_speed_kmh = (jump_dist / dt_sec) * 3.6
                if apparent_speed_kmh > 180.0:
                    # Jitter spike detected: interpolate towards projected segment
                    lat = (last_valid_pt["lat"] * 0.7) + (lat * 0.3)
                    lon = (last_valid_pt["lon"] * 0.7) + (lon * 0.3)

            matched = self.match_coordinate(lat, lon, heading=heading, speed_kmh=speed)
            matched["vehicle_id"] = item.get("vehicle_id", "UNKNOWN")
            matched["timestamp"] = item.get("timestamp")
            matched["speed_kmh"] = speed
            matched_results.append(matched)

            last_valid_pt = {"lat": lat, "lon": lon, "timestamp": item.get("timestamp", 0)}

        return matched_results

    def get_all_road_links(self) -> List[Dict[str, Any]]:
        """Returns all road links in the network with their geometries."""
        return self.road_links


# Singleton instance
map_matching_engine = MapMatchingEngine()
