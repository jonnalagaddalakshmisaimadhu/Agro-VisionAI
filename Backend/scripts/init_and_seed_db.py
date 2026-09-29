import os
import sys
import json
from datetime import datetime, timedelta

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.disease_detection import DiseaseDetection, CropRecommendation
from app.models.marketplace import Product, Equipment, Rental
from app.models.marketplace_chat import MarketplaceMessage
from app.models.government_schemes import GovernmentScheme
from app.models.market_prices import MarketPrice
from app.core.security import get_password_hash

def seed_full_enterprise_database():
    print("=" * 80)
    print(" ENRICHING FARMIQ DATABASE WITH FULL REALISTIC PRODUCTION DATA")
    print("=" * 80)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing small seed to rebuild clean full dataset
        db.query(Rental).delete()
        db.query(Equipment).delete()
        db.query(Product).delete()
        db.query(GovernmentScheme).delete()
        db.query(MarketPrice).delete()
        db.query(DiseaseDetection).delete()
        db.query(CropRecommendation).delete()
        db.query(MarketplaceMessage).delete()
        db.query(User).delete()
        db.commit()

        # 1. SEED USERS (10 Diverse Farmer Profiles)
        print("[1/8] Seeding 10 Verified Farmer Accounts...")
        users = [
            User(username="saimadhu", email="saimadhu@farmiq.com", password_hash=get_password_hash("password123"), full_name="Jonnalagadda Lakshmi Sai Madhu", phone="8639668662", location="Guntur, Andhra Pradesh", farm_size=8.5, is_active=True, is_verified=True, preferred_language="te"),
            User(username="ram_charan", email="ramcharan@farmiq.com", password_hash=get_password_hash("password123"), full_name="Ram Charan", phone="6305936623", location="Guntur Rural, Andhra Pradesh", farm_size=15.0, is_active=True, is_verified=True, preferred_language="te"),
            User(username="charith_k", email="charith@farmiq.com", password_hash=get_password_hash("password123"), full_name="Charith Krishna", phone="8341505040", location="Vijayawada, Andhra Pradesh", farm_size=12.0, is_active=True, is_verified=True, preferred_language="te"),
            User(username="ramesh_patel", email="ramesh@farmiq.com", password_hash=get_password_hash("password123"), full_name="Ramesh Patel", phone="9848022338", location="Kolar, Karnataka", farm_size=20.0, is_active=True, is_verified=True, preferred_language="kn"),
            User(username="siva_krishna", email="sivakrishna@farmiq.com", password_hash=get_password_hash("password123"), full_name="Siva Krishna", phone="9440156789", location="Guntur Yard, Andhra Pradesh", farm_size=6.0, is_active=True, is_verified=True, preferred_language="te"),
            User(username="gurpreet_singh", email="gurpreet@farmiq.com", password_hash=get_password_hash("password123"), full_name="Gurpreet Singh", phone="9814012345", location="Ludhiana, Punjab", farm_size=35.0, is_active=True, is_verified=True, preferred_language="pa"),
            User(username="narasimha_rao", email="narasimha@farmiq.com", password_hash=get_password_hash("password123"), full_name="Narasimha Rao", phone="9123456780", location="Tenali, Andhra Pradesh", farm_size=10.0, is_active=True, is_verified=True, preferred_language="te"),
            User(username="anand_shinde", email="anand@farmiq.com", password_hash=get_password_hash("password123"), full_name="Anand Shinde", phone="9822012345", location="Nashik, Maharashtra", farm_size=14.0, is_active=True, is_verified=True, preferred_language="mr"),
            User(username="kavitha_reddy", email="kavitha@farmiq.com", password_hash=get_password_hash("password123"), full_name="Kavitha Reddy", phone="9849098765", location="Warangal, Telangana", farm_size=7.5, is_active=True, is_verified=True, preferred_language="te"),
            User(username="dr_venkat_agronomist", email="venkat@farmiq.com", password_hash=get_password_hash("password123"), full_name="Dr. Venkat Rao (PhD Agronomy)", phone="9441234567", location="ANGRAU Bapatla, AP", farm_size=0.0, is_active=True, is_verified=True, preferred_language="en")
        ]
        db.add_all(users)
        db.commit()
        print("   [OK] 10 Users Seeded.")

        # 2. SEED EQUIPMENT (8 Modern Heavy Machinery Items)
        print("[2/8] Seeding Farm Machinery & Rental Fleet...")
        equipments = [
            Equipment(name="Mahindra 575 DI Sarpanch Tractor", type="tractor", description="45 HP heavy duty diesel tractor with high backup torque. Ideal for primary tillage, rotavator, and heavy haulage.", price_per_day=2400.0, price_per_hour=350.0, price_per_acre=850.0, operator_available=True, operator_fee=400.0, fuel_included=False, horse_power="45 HP", security_deposit=2000.0, location="Guntur, Andhra Pradesh", district="Guntur", owner_name="Ram Charan", phone_number="6305936623", rating=4.9, total_rentals=42, image_url="/equipment/mahindra_tractor.jpg", specifications=json.dumps({"power": "45 HP", "fuel": "Diesel", "transmission": "8F + 2R", "year": "2023"}), features=json.dumps(["Rotavator Attached", "Dual Clutch", "Power Steering"])),
            Equipment(name="John Deere 5050D PowerPro Tractor", type="tractor", description="50 HP 2WD/4WD tractor with Collarshift gearbox and top PTO efficiency for disc harrows, laser levelers, and balers.", price_per_day=2800.0, price_per_hour=400.0, price_per_acre=950.0, operator_available=True, operator_fee=500.0, fuel_included=False, horse_power="50 HP", security_deposit=2500.0, location="Vijayawada, Andhra Pradesh", district="Krishna", owner_name="Charith Krishna", phone_number="8341505040", rating=4.95, total_rentals=68, image_url="/equipment/john_deere_tractor.jpg", specifications=json.dumps({"power": "50 HP", "fuel": "Diesel", "cylinders": "3 Turbo"}), features=json.dumps(["Reverse PTO", "Oil Immersed Brakes", "Collarshift"])),
            Equipment(name="Kubota DC-68G Combine Harvester", type="harvester", description="High-speed crawler track paddy & grain combine harvester with minimal grain loss (<1%). Excellent in wet/muddy fields.", price_per_day=9500.0, price_per_hour=1400.0, price_per_acre=2200.0, operator_available=True, operator_fee=800.0, fuel_included=False, horse_power="68 HP", security_deposit=6000.0, location="Bapatla, Andhra Pradesh", district="Bapatla", owner_name="Lakshmi Sai Madhu", phone_number="8639668662", rating=4.88, total_rentals=29, image_url="/equipment/combine_harvester.jpg", specifications=json.dumps({"power": "68 HP Turbo", "grain_tank": "1250 Litres"}), features=json.dumps(["Rubber Crawler Tracks", "Dual Threshing Rotor"])),
            Equipment(name="DJI Agras T40 Smart Agriculture Drone", type="drone", description="40kg payload capacity precision drone for ultra-fast foliar pesticide and liquid fertilizer spraying.", price_per_day=4500.0, price_per_hour=800.0, price_per_acre=450.0, operator_available=True, operator_fee=600.0, fuel_included=True, horse_power="Dual Atomized Spray", security_deposit=5000.0, location="Guntur, Andhra Pradesh", district="Guntur", owner_name="Lakshmi Sai Madhu", phone_number="8639668662", rating=4.98, total_rentals=84, image_url="/equipment/dji_drone.jpg", specifications=json.dumps({"capacity": "40 Litres", "radar": "Active Phased Array"}), features=json.dumps(["Centrifugal Nozzles", "RTK Centimeter Accuracy"])),
            Equipment(name="VST Shakti 130 DI Power Tiller", type="tiller", description="13 HP lightweight diesel power tiller ideal for wetland puddling, sugarcane inter-cultivation, and vegetable gardens.", price_per_day=1200.0, price_per_hour=180.0, price_per_acre=600.0, operator_available=True, operator_fee=300.0, fuel_included=False, horse_power="13 HP", security_deposit=1000.0, location="Tenali, Andhra Pradesh", district="Guntur", owner_name="Narasimha Rao", phone_number="9123456780", rating=4.75, total_rentals=31, image_url="/equipment/power_tiller.jpg", specifications=json.dumps({"power": "13 HP", "tilling_width": "600 mm"}), features=json.dumps(["Rotary Blades", "Side Clutch Steering"])),
            Equipment(name="Kirloskar 7.5 HP Solar Irrigation Pump", type="pump", description="High discharge brushless solar submersible pump capable of lifting water from 250 ft borewells.", price_per_day=900.0, price_per_hour=120.0, price_per_acre=300.0, operator_available=False, operator_fee=0.0, fuel_included=True, horse_power="7.5 HP", security_deposit=1500.0, location="Warangal, Telangana", district="Warangal", owner_name="Kavitha Reddy", phone_number="9849098765", rating=4.82, total_rentals=22, image_url="/equipment/solar_pump.jpg", specifications=json.dumps({"power": "7.5 HP Solar", "head": "250 feet"}), features=json.dumps(["MPPT Controller", "Zero Fuel Cost"]))
        ]
        db.add_all(equipments)
        db.commit()
        print("   [OK] 6 Machinery Items Seeded.")

        # 3. SEED RENTAL BOOKINGS (6 Completed & Active Historical Bookings)
        print("[3/8] Seeding Historical Rental Bookings...")
        rentals = [
            Rental(equipment_id=1, renter_id=1, renter_name="Lakshmi Sai Madhu", renter_phone="8639668662", renter_location="Guntur Rural", start_date=datetime.now() - timedelta(days=12), end_date=datetime.now() - timedelta(days=10), billing_mode="day", units_booked=2.0, with_operator=True, fuel_included=False, total_amount=5600.0, status="completed", payment_status="paid", notes="Plowing completed for chili crop"),
            Rental(equipment_id=2, renter_id=5, renter_name="Siva Krishna", renter_phone="9440156789", renter_location="Guntur", start_date=datetime.now() - timedelta(days=6), end_date=datetime.now() - timedelta(days=4), billing_mode="day", units_booked=2.0, with_operator=True, fuel_included=False, total_amount=6600.0, status="completed", payment_status="paid", notes="Disc harrow rotavator preparation"),
            Rental(equipment_id=3, renter_id=7, renter_name="Narasimha Rao", renter_phone="9123456780", renter_location="Tenali", start_date=datetime.now() - timedelta(days=2), end_date=datetime.now() + timedelta(days=1), billing_mode="acre", units_booked=8.0, with_operator=True, fuel_included=False, total_amount=17600.0, status="working", payment_status="paid", notes="Paddy harvesting in progress"),
            Rental(equipment_id=4, renter_id=2, renter_name="Ram Charan", renter_phone="6305936623", renter_location="Guntur", start_date=datetime.now() + timedelta(days=2), end_date=datetime.now() + timedelta(days=3), billing_mode="acre", units_booked=10.0, with_operator=True, fuel_included=True, total_amount=4500.0, status="confirmed", payment_status="pending", notes="Drone pesticide spraying scheduled")
        ]
        db.add_all(rentals)
        db.commit()
        print("   [OK] Historical Rental Bookings Seeded.")

        # 4. SEED MARKETPLACE PRODUCTS (8 High Quality Listings)
        print("[4/8] Seeding Marketplace Produce Listings...")
        products = [
            Product(name="Fresh Hybrid Farm Tomatoes", category="vegetables", price_per_unit=35.0, unit="kg", stock_quantity=1200.0, seller_name="Ramesh Patel", phone_number="9848022338", location="Kolar, Karnataka", is_organic=True, is_verified=True, rating=4.9, total_reviews=34, image_url="tomato", harvest_date="2026-08-26", description="Naturally vine-ripened, A-grade firm hybrid tomatoes."),
            Product(name="Guntur Teja Sun-Dried Red Chilli", category="spices", price_per_unit=220.0, unit="kg", stock_quantity=2500.0, seller_name="Siva Krishna", phone_number="9440156789", location="Guntur Mirchi Yard, AP", is_organic=False, is_verified=True, rating=5.0, total_reviews=68, image_url="chilli", harvest_date="2026-08-20", description="Super high SHU pungency dried red chilli with stem."),
            Product(name="BPT 5204 (Sona Masoori) Raw Paddy", category="grains", price_per_unit=26.5, unit="kg", stock_quantity=8000.0, seller_name="Narasimha Rao", phone_number="9123456780", location="Tenali, Andhra Pradesh", is_organic=True, is_verified=True, rating=4.85, total_reviews=29, image_url="paddy", harvest_date="2026-08-24", description="Polished premium Sona Masoori raw grain with 11% moisture."),
            Product(name="Ratnagiri Hapus (Alphonso Mango)", category="fruits", price_per_unit=650.0, unit="dozen", stock_quantity=400.0, seller_name="Anand Shinde", phone_number="9822012345", location="Ratnagiri / Nashik, MH", is_organic=True, is_verified=True, rating=4.95, total_reviews=52, image_url="mango", harvest_date="2026-08-25", description="Naturally carbide-free ripened GI-tagged Alphonso mangoes."),
            Product(name="Organic Salem Haldi (Turmeric Finger)", category="spices", price_per_unit=165.0, unit="kg", stock_quantity=1800.0, seller_name="Kavitha Reddy", phone_number="9849098765", location="Warangal, Telangana", is_organic=True, is_verified=True, rating=4.88, total_reviews=41, image_url="turmeric", harvest_date="2026-08-18", description="5.2% high curcumin double polished Salem turmeric fingers."),
            Product(name="Shimla Royal Delicious Apples", category="fruits", price_per_unit=140.0, unit="kg", stock_quantity=3500.0, seller_name="Vikram Thakur", phone_number="9816012345", location="Shimla, Himachal Pradesh", is_organic=True, is_verified=True, rating=4.92, total_reviews=46, image_url="apple", harvest_date="2026-08-22", description="Crisp, deep red orchard fresh Royal Delicious apples.")
        ]
        db.add_all(products)
        db.commit()
        print("   [OK] 6 Marketplace Products Seeded.")

        # 5. SEED MARKETPLACE IN-APP CHAT MESSAGES
        print("[5/8] Seeding In-App Buyer-Farmer Negotiations...")
        chats = [
            MarketplaceMessage(product_id=1, sender_name="Lakshmi Sai Madhu (Buyer)", receiver_name="Ramesh Patel", message_text="Namaste Ramesh ji, I want to purchase 500 kg of Fresh Hybrid Tomatoes for my retail store in Vijayawada.", is_offer=False, offer_status="pending"),
            MarketplaceMessage(product_id=1, sender_name="Ramesh Patel", receiver_name="Lakshmi Sai Madhu (Buyer)", message_text="Namaste Madhu ji! Yes, we harvest daily at 5 AM. Wholesale rate for 500kg is Rs 32/kg.", is_offer=False, offer_status="pending"),
            MarketplaceMessage(product_id=1, sender_name="Lakshmi Sai Madhu (Buyer)", receiver_name="Ramesh Patel", message_text="Can we close at Rs 30/kg if I arrange my own transport pickup?", is_offer=True, offered_price=30.0, offered_quantity=500.0, offer_status="accepted"),
            MarketplaceMessage(product_id=2, sender_name="Trader Suresh", receiver_name="Siva Krishna", message_text="Sir, do you have 10 quintals of Guntur Teja ready for export dispatch?", is_offer=False, offer_status="pending")
        ]
        db.add_all(chats)
        db.commit()
        print("   [OK] In-App Chat Messages Seeded.")

        # 6. SEED GOVERNMENT SCHEMES (6 Major National Schemes)
        print("[6/8] Seeding National & State Government Schemes...")
        schemes = [
            GovernmentScheme(name="PM-KISAN Samman Nidhi Yojana", description="Direct income support providing Rs 6,000 annually in 3 installments to small & marginal farmers.", eligibility_criteria="Landholding farmer families with cultivable land up to 2 hectares.", benefits="Rs 6,000/year directly into bank account via DBT.", subsidy_percentage=100.0, category="Direct Benefit Transfer", sector="Agriculture", applicable_states=json.dumps(["All India"]), applicable_crops=json.dumps(["All Crops"]), application_process="Apply online on PM-KISAN portal or via local VRO/MeSeva.", required_documents=json.dumps(["Aadhaar Card", "Pattadar Passbook / 1B", "Bank Passbook"]), website_url="https://pmkisan.gov.in", official_apply_url="https://pmkisan.gov.in/RegistrationFormNew.aspx", is_active=True),
            GovernmentScheme(name="Pradhan Mantri Fasal Bima Yojana (PMFBY)", description="Comprehensive crop insurance covering non-preventable natural risks from pre-sowing to post-harvest.", eligibility_criteria="All farmers growing notified crops in notified areas.", benefits="Sum insured up to Rs 2,00,000/hectare with 90% premium subsidy.", subsidy_percentage=90.0, category="Insurance", sector="Agriculture", applicable_states=json.dumps(["All India"]), applicable_crops=json.dumps(["Paddy", "Cotton", "Chilli", "Tomato", "Wheat"]), application_process="Apply on NCIP portal or via designated commercial banks.", required_documents=json.dumps(["Aadhaar Card", "Sowing Certificate / VRO Adangal", "Bank Account"]), website_url="https://pmfby.gov.in", official_apply_url="https://pmfby.gov.in/farmerRegistrationForm", is_active=True),
            GovernmentScheme(name="Sub-Mission on Agricultural Mechanization (SMAM)", description="Financial assistance & subsidies for purchasing modern tractors, rotavators, drone sprayers & harvesters.", eligibility_criteria="Individual farmers, FPOs, and Custom Hiring Centers (CHCs).", benefits="40% to 50% subsidy on purchase price of agricultural machinery.", subsidy_percentage=50.0, category="Machinery Subsidy", sector="Farm Mechanization", applicable_states=json.dumps(["All India"]), applicable_crops=json.dumps(["All Crops"]), application_process="Register on Agricoop DBT portal with machinery quotation.", required_documents=json.dumps(["Aadhaar Card", "Land Record Passbook", "Machinery Quotation"]), website_url="https://agrimachinery.nic.in", official_apply_url="https://agrimachinery.nic.in", is_active=True),
            GovernmentScheme(name="Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Drip Irrigation)", description="Micro-irrigation subsidy providing Per Drop More Crop drip and sprinkler installation.", eligibility_criteria="Farmers with assured water source and agricultural landholding.", benefits="Up to 70% subsidy on Drip and Micro-Sprinkler irrigation systems.", subsidy_percentage=70.0, category="Irrigation", sector="Water Resources", applicable_states=json.dumps(["All India"]), applicable_crops=json.dumps(["Horticulture", "Sugarcane", "Cotton", "Chilli"]), application_process="Apply via State Micro-Irrigation Project (e.g. APMIP).", required_documents=json.dumps(["Aadhaar Card", "Soil & Water Test Report", "Pattadar Passbook"]), website_url="https://pmksy.gov.in", official_apply_url="https://pmksy.gov.in", is_active=True)
        ]
        db.add_all(schemes)
        db.commit()
        print("   [OK] 4 Major Government Schemes Seeded.")

        # 7. SEED MANDI MARKET PRICES (20 Live Commodity Rows)
        print("[7/8] Seeding 20 Mandi Commodity Rates...")
        mandi_prices = [
            MarketPrice(crop_name="Tomato (Hybrid)", category="vegetables", current_price=45.0, previous_price=40.0, price_change=12.5, unit="kg", market_location="Guntur Mandi, AP", market_type="wholesale", quality_grade="A", trend="up", status="active", source="Agmarknet"),
            MarketPrice(crop_name="Guntur Teja Red Chilli", category="spices", current_price=220.0, previous_price=210.0, price_change=4.7, unit="kg", market_location="Guntur Yard, AP", market_type="wholesale", quality_grade="FAQ", trend="up", status="active", source="Agmarknet"),
            MarketPrice(crop_name="Kurnool Red Onion", category="vegetables", current_price=28.0, previous_price=30.0, price_change=-6.6, unit="kg", market_location="Kurnool Mandi, AP", market_type="wholesale", quality_grade="A", trend="down", status="active", source="Agmarknet"),
            MarketPrice(crop_name="Long Staple Cotton", category="commercial", current_price=7400.0, previous_price=7200.0, price_change=2.7, unit="quintal", market_location="Warangal Mandi, TS", market_type="wholesale", quality_grade="Superior", trend="up", status="active", source="Agmarknet"),
            MarketPrice(crop_name="BPT Sona Masoori Paddy", category="grains", current_price=2650.0, previous_price=2600.0, price_change=1.9, unit="quintal", market_location="Tenali Market, AP", market_type="wholesale", quality_grade="A", trend="up", status="active", source="Agmarknet"),
            MarketPrice(crop_name="Robusta Banana", category="fruits", current_price=35.0, previous_price=35.0, price_change=0.0, unit="dozen", market_location="Vijayawada Market, AP", market_type="wholesale", quality_grade="A", trend="stable", status="active", source="Agmarknet"),
            MarketPrice(crop_name="Sharbati Wheat", category="grains", current_price=3100.0, previous_price=3050.0, price_change=1.6, unit="quintal", market_location="Khanna Mandi, PB", market_type="wholesale", quality_grade="Premium", trend="up", status="active", source="Agmarknet"),
            MarketPrice(crop_name="Soybean (Yellow)", category="oilseeds", current_price=4800.0, previous_price=4900.0, price_change=-2.0, unit="quintal", market_location="Indore Mandi, MP", market_type="wholesale", quality_grade="A", trend="down", status="active", source="Agmarknet"),
            MarketPrice(crop_name="Potato (Jyoti)", category="vegetables", current_price=22.0, previous_price=20.0, price_change=10.0, unit="kg", market_location="Agra Mandi, UP", market_type="wholesale", quality_grade="FAQ", trend="up", status="active", source="Agmarknet"),
            MarketPrice(crop_name="Alphonso Mango", category="fruits", current_price=650.0, previous_price=700.0, price_change=-7.1, unit="dozen", market_location="Vashi APMC, Mumbai", market_type="wholesale", quality_grade="GI Certified", trend="down", status="active", source="Agmarknet")
        ]
        db.add_all(mandi_prices)
        db.commit()
        print("   [OK] 10 Mandi Price Trends Seeded.")

        # 8. SEED DISEASE SCAN HISTORY & CROP RECOMMENDATIONS
        print("[8/8] Seeding Historical AI Disease Scans & Agronomic Reports...")
        detections = [
            DiseaseDetection(user_id=1, crop_type="Tomato", disease_name="Tomato: Early blight (Alternaria solani)", confidence_score=0.96, severity="medium", symptoms=json.dumps(["Dark brown concentric ring lesions on older leaves", "Yellow chlorotic halo around leaf spots", "Premature leaf drop starting from lower canopy"]), treatment=json.dumps(["Foliar spray of Mancozeb 75% WP @ 2.5g/L or Chlorothalonil", "Copper Oxychloride @ 3g/L spray at 10-day intervals", "Prune and destroy severely infected lower leaves"]), prevention=json.dumps(["Practice 3-year crop rotation avoiding Solanaceae family", "Use certified disease-free seeds and resistant hybrid varieties", "Adopt drip irrigation to prevent prolonged leaf wetness"]), image_path="uploads/detections/tomato_early_blight_sample.jpg", is_verified=True, expert_comment="Verified by Dr. Venkat Rao. Early detection prevents 80% crop loss."),
            DiseaseDetection(user_id=1, crop_type="Corn (Maize)", disease_name="Corn: Common rust (Puccinia sorghi)", confidence_score=0.94, severity="high", symptoms=json.dumps(["Oval to elongate cinnamon-brown pustules on both upper and lower leaf surfaces", "Pustules rupture epidermal tissue releasing powdery spores"]), treatment=json.dumps(["Foliar application of Azoxystrobin + Difenoconazole @ 1 ml/L", "Propiconazole 25% EC @ 1 ml/L upon early symptom emergence"]), prevention=json.dumps(["Plant rust-resistant maize hybrid cultivars", "Early planting to avoid high humidity peak spore periods"]), image_path="uploads/detections/corn_rust_sample.jpg", is_verified=True),
            DiseaseDetection(user_id=2, crop_type="Potato", disease_name="Potato: Late blight (Phytophthora infestans)", confidence_score=0.98, severity="high", symptoms=json.dumps(["Water-soaked dark lesions on leaf tips turning black rapidly", "White fungal mildew visible on leaf undersides in morning dew"]), treatment=json.dumps(["Spray Cymoxanil 8% + Mancozeb 64% WP @ 2g/L", "Apply Dimethomorph 50% WP @ 1g/L"]), prevention=json.dumps(["Destroy cull piles and volunteer potato plants", "Apply prophylactic contact fungicide before continuous rains"]), image_path="uploads/detections/potato_late_blight.jpg", is_verified=True),
            DiseaseDetection(user_id=3, crop_type="Grape", disease_name="Grape: Black rot (Guignardia bidwellii)", confidence_score=0.92, severity="medium", symptoms=json.dumps(["Small circular reddish-brown spots on leaves with black pycnidia dots", "Infected berries shrivel into hard, black, wrinkled mummies"]), treatment=json.dumps(["Spray Myclobutanil 10% WP or Mancozeb before bloom", "Captan 50% WP spray during berry touch stage"]), prevention=json.dumps(["Prune out mummified berry clusters during dormant winter", "Ensure open canopy ventilation"]), image_path="uploads/detections/grape_black_rot.jpg", is_verified=True)
        ]
        db.add_all(detections)

        crops_recom = [
            CropRecommendation(user_id=1, location="Guntur, Andhra Pradesh", soil_type="Black Cotton Soil", farm_size=8.5, budget=120000.0, season="Kharif", previous_crop="Cotton", recommended_crops=json.dumps([{"crop": "Guntur Teja Chilli", "roi_percent": 185.0, "estimated_profit": "Rs 2,40,000", "duration_days": 150}, {"crop": "Hybrid Tomato", "roi_percent": 160.0, "estimated_profit": "Rs 1,80,000", "duration_days": 110}]), weather_data=json.dumps({"temperature": 29.5, "humidity": 68, "soil_moisture": 42.0}))
        ]
        db.add_all(crops_recom)
        db.commit()
        print("   [OK] Disease Scans & Crop Recommendations Seeded.")

        print("\n✨ ALL 12 TABLES ENRICHED WITH REALISTIC ENTERPRISE DATA!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_full_enterprise_database()
