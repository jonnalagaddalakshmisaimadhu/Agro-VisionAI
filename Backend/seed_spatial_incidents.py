"""
Seed spatial incidents for Phase 1 routing & hazard corridor testing.
"""
from app.database import SessionLocal
from app.models.spatial_incident import SpatialIncident

def seed_incidents():
    db = SessionLocal()
    try:
        # Check if already seeded
        count = db.query(SpatialIncident).count()
        if count > 0:
            print(f"Spatial incidents already exist: {count} found.")
            return

        sample_incidents = [
            SpatialIncident(
                title="Agricultural Freight Congestion - NH16 Junction",
                incident_type="congestion",
                severity="medium",
                latitude=16.4410,
                longitude=80.5620,
                radius_meters=200.0,
                description="Heavy grain tractor queue slowing traffic flow at interchange.",
                reported_by="AP_Traffic_Sensor",
                is_active=True
            ),
            SpatialIncident(
                title="Road Resurfacing Work - NH65 Corridor",
                incident_type="road_work",
                severity="high",
                latitude=16.5120,
                longitude=80.6250,
                radius_meters=350.0,
                description="Single-lane detour active due to culvert repairs.",
                reported_by="Highways_Authority",
                is_active=True
            ),
            SpatialIncident(
                title="Waterlogging & Mud Hazard - Rural Feeder Road",
                incident_type="hazard",
                severity="medium",
                latitude=16.3500,
                longitude=80.4800,
                radius_meters=180.0,
                description="Recent heavy rain left soil slurry across tarmac, reduce speed.",
                reported_by="Field_Agent_Rao",
                is_active=True
            ),
            SpatialIncident(
                title="Tractor Breakdown - Canal Crossing Bridge",
                incident_type="accident",
                severity="critical",
                latitude=16.4800,
                longitude=80.5900,
                radius_meters=120.0,
                description="Disabled trailer blocking both lanes, recovery crane dispatched.",
                reported_by="Citizen_Report",
                is_active=True
            )
        ]

        db.add_all(sample_incidents)
        db.commit()
        print(f"Successfully seeded {len(sample_incidents)} spatial incidents!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_incidents()
