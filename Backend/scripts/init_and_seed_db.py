import os
import sys
import json
from datetime import datetime, timedelta

# Add Backend to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.disease_detection import DiseaseDetection, CropRecommendation
from app.models.marketplace import Product, Equipment, Rental
from app.models.marketplace_chat import MarketplaceMessage
from app.models.government_schemes import GovernmentScheme
from app.models.market_prices import MarketPrice
from app.core.security import get_password_hash

def seed_database():
    print("=" * 80)
    print(" FARMIQ DATABASE INITIALIZER & SEEDER")
    print("=" * 80)

    # 1. Create all tables
    print("[1/6] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("   [OK] All tables created successfully.")

    db = SessionLocal()

    try:
        # 2. Seed Demo Users
        if db.query(User).count() == 0:
            print("[2/6] Seeding Demo Users...")
            demo_users = [
                User(
                    username="farmer_demo",
                    email="farmer@farmiq.com",
                    password_hash=get_password_hash("password123"),
                    full_name="Lakshmi Sai Madhu",
                    phone="8639668662",
                    location="Guntur, Andhra Pradesh",
                    farm_size=5.5,
                    is_active=True,
                    is_verified=True,
                    preferred_language="te"
                ),
                User(
                    username="ram_charan",
                    email="ramcharan@farmiq.com",
                    password_hash=get_password_hash("password123"),
                    full_name="Ram Charan",
                    phone="6305936623",
                    location="Guntur, Andhra Pradesh",
                    farm_size=12.0,
                    is_active=True,
                    is_verified=True,
                    preferred_language="te"
                )
            ]
            db.add_all(demo_users)
            db.commit()
            print("   [OK] Users seeded.")

        # 3. Seed Equipment
        if db.query(Equipment).count() == 0:
            print("[3/6] Seeding Farm Machinery & Equipment...")
            equipments = [
                Equipment(
                    name="Mahindra 575 DI Sarpanch Tractor",
                    type="tractor",
                    description="45 HP heavy duty diesel tractor with high backup torque. Ideal for primary tillage, rotavator, and heavy haulage.",
                    price_per_day=2400.0,
                    price_per_hour=350.0,
                    price_per_acre=850.0,
                    operator_available=True,
                    operator_fee=400.0,
                    fuel_included=False,
                    horse_power="45 HP",
                    security_deposit=2000.0,
                    location="Guntur, Andhra Pradesh",
                    district="Guntur",
                    owner_name="Ram Charan",
                    phone_number="6305936623",
                    rating=4.9,
                    total_rentals=42,
                    image_url="/equipment/mahindra_tractor.jpg",
                    specifications=json.dumps({"power": "45 HP", "fuel": "Diesel", "cylinders": "4", "transmission": "8 Forward + 2 Reverse"}),
                    features=json.dumps(["Heavy Duty Rotavator Attached", "Dual Clutch", "Power Steering", "Hydraulic Lift (1600 kg)"])
                ),
                Equipment(
                    name="John Deere 5050D PowerPro Tractor",
                    type="tractor",
                    description="50 HP 2WD/4WD tractor with Collarshift gearbox and top PTO efficiency for disc harrows, laser levelers, and balers.",
                    price_per_day=2800.0,
                    price_per_hour=400.0,
                    price_per_acre=950.0,
                    operator_available=True,
                    operator_fee=500.0,
                    fuel_included=False,
                    horse_power="50 HP",
                    security_deposit=2500.0,
                    location="Vijayawada, Andhra Pradesh",
                    district="Krishna",
                    owner_name="Charith",
                    phone_number="8341505040",
                    rating=4.95,
                    total_rentals=68,
                    image_url="/equipment/john_deere_tractor.jpg",
                    specifications=json.dumps({"power": "50 HP", "fuel": "Diesel", "cylinders": "3 Turbo", "transmission": "8F + 4R Collarshift"}),
                    features=json.dumps(["Reverse PTO", "Oil Immersed Disc Brakes", "Mechanical Quick Raise Lever"])
                ),
                Equipment(
                    name="Kubota DC-68G Combine Harvester",
                    type="harvester",
                    description="High-speed crawler track paddy & grain combine harvester with minimal grain loss (<1%). Excellent performance in wet and muddy paddy fields.",
                    price_per_day=9500.0,
                    price_per_hour=1400.0,
                    price_per_acre=2200.0,
                    operator_available=True,
                    operator_fee=800.0,
                    fuel_included=False,
                    horse_power="68 HP",
                    security_deposit=6000.0,
                    location="Bapatla, Andhra Pradesh",
                    district="Bapatla",
                    owner_name="Sai Madhu",
                    phone_number="8639668662",
                    rating=4.88,
                    total_rentals=29,
                    image_url="/equipment/combine_harvester.jpg",
                    specifications=json.dumps({"power": "68 HP Turbocharged Diesel", "cutter_width": "2.0 meters", "grain_tank": "1250 Litres"}),
                    features=json.dumps(["Full Rubber Crawler Tracks (Mud Ready)", "Dual Threshing Rotor", "Automatic Header Leveling"])
                )
            ]
            db.add_all(equipments)
            db.commit()
            print("   [OK] Equipment seeded.")

        # 4. Seed Marketplace Products
        if db.query(Product).count() == 0:
            print("[4/6] Seeding Marketplace Products...")
            products = [
                Product(
                    name="Fresh Hybrid Tomatoes",
                    description="Naturally ripened, firm hybrid tomatoes harvested daily from organic polyhouse.",
                    category="vegetables",
                    price_per_unit=35.0,
                    unit="kg",
                    stock_quantity=800.0,
                    seller_name="Ramesh Patel",
                    phone_number="9848022338",
                    location="Kolar, Karnataka",
                    is_organic=True,
                    is_verified=True,
                    rating=4.9,
                    total_reviews=24,
                    image_url="tomato"
                ),
                Product(
                    name="Guntur Teja Red Chilli",
                    description="High pungency, sun-dried Guntur Teja dried red chilli. Direct from farm.",
                    category="spices",
                    price_per_unit=220.0,
                    unit="kg",
                    stock_quantity=1500.0,
                    seller_name="Siva Krishna",
                    phone_number="9440156789",
                    location="Guntur, Andhra Pradesh",
                    is_organic=False,
                    is_verified=True,
                    rating=5.0,
                    total_reviews=42,
                    image_url="chilli"
                ),
                Product(
                    name="BPT 5204 (Sona Masoori) Paddy",
                    description="A-grade polished Sona Masoori paddy grain with low moisture content (<12%).",
                    category="grains",
                    price_per_unit=26.5,
                    unit="kg",
                    stock_quantity=5000.0,
                    seller_name="Narasimha Rao",
                    phone_number="9123456780",
                    location="Tenali, Andhra Pradesh",
                    is_organic=True,
                    is_verified=True,
                    rating=4.85,
                    total_reviews=19,
                    image_url="paddy"
                )
            ]
            db.add_all(products)
            db.commit()
            print("   [OK] Products seeded.")

        # 5. Seed Government Schemes
        if db.query(GovernmentScheme).count() == 0:
            print("[5/6] Seeding Government Schemes...")
            schemes = [
                GovernmentScheme(
                    name="PM-KISAN Samman Nidhi Yojana",
                    description="Direct income support to farmers providing financial assistance of Rs 6,000 annually.",
                    eligibility_criteria="Small and marginal farmer families possessing cultivable landholding up to 2 hectares.",
                    benefits="Rs 6,000 per year transferred in 3 equal four-monthly installments directly into Aadhaar-seeded bank accounts.",
                    subsidy_percentage=100.0,
                    category="Direct Benefit Transfer",
                    sector="Agriculture",
                    applicable_states=json.dumps(["All India"]),
                    applicable_crops=json.dumps(["All Crops"]),
                    application_process="Online self-registration on PM-KISAN portal or via Common Service Centers (CSCs).",
                    required_documents=json.dumps(["Aadhaar Card", "Pattadar Passbook / Land Records", "Bank Passbook"]),
                    website_url="https://pmkisan.gov.in",
                    official_apply_url="https://pmkisan.gov.in/RegistrationFormNew.aspx",
                    is_active=True,
                    is_new=False
                ),
                GovernmentScheme(
                    name="Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                    description="Comprehensive crop insurance scheme providing financial support in the event of crop failure.",
                    eligibility_criteria="All farmers growing notified food crops, oilseeds, and annual commercial/horticultural crops.",
                    benefits="Comprehensive risk insurance covering post-harvest losses, unseasonal rainfall, pest attacks.",
                    subsidy_percentage=90.0,
                    category="Insurance",
                    sector="Agriculture",
                    applicable_states=json.dumps(["All India"]),
                    applicable_crops=json.dumps(["Rice", "Wheat", "Cotton", "Maize", "Chilli", "Tomato"]),
                    application_process="Apply via National Crop Insurance Portal (NCIP) or designated commercial banks / PACS.",
                    required_documents=json.dumps(["Aadhaar Card", "Sowing Certificate / VRO Adangal", "Land Record"]),
                    website_url="https://pmfby.gov.in",
                    official_apply_url="https://pmfby.gov.in/farmerRegistrationForm",
                    is_active=True,
                    is_new=False
                )
            ]
            db.add_all(schemes)
            db.commit()
            print("   [OK] Government Schemes seeded.")

        # 6. Seed Market Prices & Disease Detections
        if db.query(MarketPrice).count() == 0:
            print("[6/6] Seeding Market Mandi Prices...")
            mandi_prices = [
                MarketPrice(crop_name="Tomato", category="vegetables", current_price=45.0, previous_price=40.0, price_change=12.5, unit="kg", market_location="Guntur Mandi, AP", market_type="wholesale", quality_grade="A", trend="up", status="active", source="Agmarknet"),
                MarketPrice(crop_name="Red Chilli", category="spices", current_price=220.0, previous_price=210.0, price_change=4.7, unit="kg", market_location="Guntur Yard, AP", market_type="wholesale", quality_grade="FAQ", trend="up", status="active", source="Agmarknet"),
                MarketPrice(crop_name="Onion", category="vegetables", current_price=28.0, previous_price=30.0, price_change=-6.6, unit="kg", market_location="Kurnool Mandi, AP", market_type="wholesale", quality_grade="A", trend="down", status="active", source="Agmarknet"),
                MarketPrice(crop_name="Cotton", category="commercial", current_price=7400.0, previous_price=7200.0, price_change=2.7, unit="quintal", market_location="Warangal Mandi, TS", market_type="wholesale", quality_grade="Superior", trend="up", status="active", source="Agmarknet"),
                MarketPrice(crop_name="Paddy (Sona Masoori)", category="grains", current_price=2650.0, previous_price=2600.0, price_change=1.9, unit="quintal", market_location="Tenali Market, AP", market_type="wholesale", quality_grade="A", trend="up", status="active", source="Agmarknet"),
                MarketPrice(crop_name="Banana", category="fruits", current_price=35.0, previous_price=35.0, price_change=0.0, unit="dozen", market_location="Vijayawada Market, AP", market_type="wholesale", quality_grade="A", trend="stable", status="active", source="Agmarknet")
            ]
            db.add_all(mandi_prices)
            db.commit()
            print("   [OK] Mandi Prices seeded.")

        # Seed sample Disease Detections
        if db.query(DiseaseDetection).count() == 0:
            detections = [
                DiseaseDetection(
                    crop_type="Tomato",
                    disease_name="Tomato: Early blight (Alternaria solani)",
                    confidence_score=0.96,
                    severity="medium",
                    symptoms=json.dumps(["Dark brown concentric ring lesions on older leaves", "Yellow chlorotic halo around leaf spots", "Premature defoliation starting from lower canopy"]),
                    treatment=json.dumps(["Foliar spray of Mancozeb 75% WP @ 2.5g/L or Chlorothalonil", "Copper Oxychloride @ 3g/L spray at 10-day intervals", "Prune and destroy severely infected lower leaves"]),
                    prevention=json.dumps(["Practice 3-year crop rotation avoiding Solanaceae family", "Use certified disease-free seeds and resistant hybrid varieties", "Adopt drip irrigation to prevent prolonged leaf wetness"]),
                    image_path="uploads/detections/sample_early_blight.jpg"
                ),
                DiseaseDetection(
                    crop_type="Corn (Maize)",
                    disease_name="Corn: Common rust (Puccinia sorghi)",
                    confidence_score=0.94,
                    severity="high",
                    symptoms=json.dumps(["Oval to elongate cinnamon-brown pustules on both upper and lower leaf surfaces", "Pustules rupture epidermal tissue releasing powdery spores"]),
                    treatment=json.dumps(["Foliar application of Azoxystrobin + Difenoconazole @ 1 ml/L", "Propiconazole 25% EC @ 1 ml/L upon early symptom emergence"]),
                    prevention=json.dumps(["Plant rust-resistant maize hybrid cultivars", "Early planting to avoid high humidity peak spore periods"]),
                    image_path="uploads/detections/sample_corn_rust.jpg"
                )
            ]
            db.add_all(detections)
            db.commit()
            print("   [OK] Sample Disease Detections seeded.")

        print("\nDatabase initialization & seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
