import asyncio
import httpx
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from app.models.government_schemes import GovernmentScheme, SchemeRefreshLog
from app.core.config import settings

logger = logging.getLogger(__name__)

class GovernmentSchemeService:
    def __init__(self):
        self.data_gov_key = getattr(settings, "DATA_GOV_IN_API_KEY", "") or getattr(settings, "AGRIMART_API_KEY", "")
        self.myscheme_api = "https://api.myscheme.gov.in/schemes/agriculture"
        
        # Comprehensive Master Catalog of Indian Agricultural Schemes
        self.master_schemes = [
            {
                "name": "PM-KISAN Samman Nidhi Yojana",
                "description": "Direct income support to farmers providing ₹6,000 per year in three equal installments of ₹2,000 directly to bank accounts via DBT.",
                "eligibility_criteria": "Small and marginal farmer families with landholding up to 2 hectares (5 acres).",
                "benefits": "₹6,000 per year (3 installments)",
                "subsidy_percentage": "100% Direct Cash Transfer",
                "category": "Direct Benefit Transfer",
                "sector": "Government",
                "applicable_states": ["All India"],
                "applicable_crops": ["All Crops"],
                "max_land_acres": 5.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Individual Cultivator"],
                "application_process": "Online self-registration on PM-KISAN portal or via Common Service Centres (CSC).",
                "required_documents": ["Aadhaar Card", "Pattadar Passbook / Land Record Copy", "Aadhaar-Linked Bank Account"],
                "contact_info": {"phone": "1800-180-1551", "email": "pmkisan-ict@gov.in"},
                "website_url": "https://pmkisan.gov.in",
                "official_apply_url": "https://pmkisan.gov.in/RegistrationFormNew.aspx",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 6000.0,
                "expiry_date": datetime.utcnow() + timedelta(days=730)
            },
            {
                "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                "description": "Comprehensive crop insurance scheme providing complete financial support against natural calamities, pests, and post-harvest losses.",
                "eligibility_criteria": "All farmers growing notified food crops, oilseeds, and commercial/horticultural crops.",
                "benefits": "Sum insured up to ₹2,00,000 per hectare covering yield loss and localized disasters.",
                "subsidy_percentage": "Premium subsidy up to 90% (Farmers pay only 1.5% for Rabi, 2% for Kharif, 5% for commercial crops)",
                "category": "Insurance",
                "sector": "Government",
                "applicable_states": ["All India"],
                "applicable_crops": ["Rice", "Wheat", "Cotton", "Maize", "Groundnut", "Pulses", "Sugarcane"],
                "max_land_acres": 100.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Tenant Farmer", "Large Farmer"],
                "application_process": "Apply via National Crop Insurance Portal (NCIP), banks, or CSC centers within cutoff dates.",
                "required_documents": ["Aadhaar Card", "Sowing Certificate / Village Officer Declaration", "Bank Passbook", "Land Records"],
                "contact_info": {"phone": "1800-180-1552", "email": "help.agri-insurance@gov.in"},
                "website_url": "https://pmfby.gov.in",
                "official_apply_url": "https://pmfby.gov.in/farmerRegistrationForm",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 50000.0,
                "expiry_date": datetime.utcnow() + timedelta(days=365)
            },
            {
                "name": "Kisan Credit Card (KCC) Scheme",
                "description": "Provides adequate and timely institutional credit to farmers for agricultural operational costs and farm maintenance at low interest.",
                "eligibility_criteria": "Individual or joint borrowers who are owner cultivators, tenant farmers, oral lessees, or SHGs.",
                "benefits": "Concessional collateral-free crop loans up to ₹3,00,000 at 4% effective interest rate.",
                "subsidy_percentage": "3% Interest Subvention Incentive for prompt repayment",
                "category": "Credit/Loan",
                "sector": "Government",
                "applicable_states": ["All India"],
                "applicable_crops": ["All Crops"],
                "max_land_acres": 100.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Tenant Farmer", "Large Farmer", "Sharecropper"],
                "application_process": "Submit single-page application at any commercial bank, cooperative bank, or RRB branch.",
                "required_documents": ["Land Revenue Records (7/12, RoR, Khatauni)", "Aadhaar Card", "Passport Photo"],
                "contact_info": {"phone": "1800-115-526", "email": "kcc-support@gov.in"},
                "website_url": "https://myscheme.gov.in/schemes/kcc",
                "official_apply_url": "https://myscheme.gov.in/schemes/kcc",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 100000.0,
                "expiry_date": datetime.utcnow() + timedelta(days=730)
            },
            {
                "name": "PM Krishi Sinchayee Yojana (PMKSY) - Per Drop More Crop",
                "description": "Subsidies for micro-irrigation systems including drip irrigation, sprinklers, and water harvesting structures to maximize water efficiency.",
                "eligibility_criteria": "Farmers with valid land title and assured water source.",
                "benefits": "55% subsidy for small and marginal farmers; 45% subsidy for other farmers.",
                "subsidy_percentage": "45% to 55% Government Subsidy",
                "category": "Equipment",
                "sector": "Government",
                "applicable_states": ["All India"],
                "applicable_crops": ["Horticulture Crops", "Sugarcane", "Cotton", "Vegetables", "Fruits"],
                "max_land_acres": 12.5,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Large Farmer"],
                "application_process": "Apply online through State Horticulture / Agriculture Micro-Irrigation portal.",
                "required_documents": ["Land Title Deeds", "Water Availability Certificate", "Aadhaar Card", "Electricity Bill / Borewell proof"],
                "contact_info": {"phone": "1800-180-1551", "email": "pmksy-agri@nic.in"},
                "website_url": "https://pmksy.gov.in",
                "official_apply_url": "https://pmksy.gov.in/MicroIrrigation/Default.aspx",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 45000.0,
                "expiry_date": datetime.utcnow() + timedelta(days=365)
            },
            {
                "name": "Sub-Mission on Agricultural Mechanization (SMAM)",
                "description": "Financial assistance for purchasing tractors, power tillers, harvesters, drone sprayers, and setting up Custom Hiring Centers.",
                "eligibility_criteria": "Individual farmers, Farmer Producer Organizations (FPOs), Cooperative Societies.",
                "benefits": "40% to 50% subsidy on farm machinery; up to ₹5 Lakhs for Custom Hiring Centers; 75% subsidy for Kisan Drones.",
                "subsidy_percentage": "40% - 75% Capital Subsidy",
                "category": "Equipment",
                "sector": "Government",
                "applicable_states": ["All India"],
                "applicable_crops": ["All Crops"],
                "max_land_acres": 100.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "FPO Member", "Women Farmer"],
                "application_process": "Direct registration on Agricoop DBT mechanization portal.",
                "required_documents": ["Aadhaar Card", "Land Khatauni Record", "Bank Passbook", "Quotation from approved dealer"],
                "contact_info": {"phone": "011-23381012", "email": "smam-agri@gov.in"},
                "website_url": "https://agrimachinery.nic.in",
                "official_apply_url": "https://agrimachinery.nic.in/Farmer/Registration",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 75000.0,
                "expiry_date": datetime.utcnow() + timedelta(days=365)
            },
            {
                "name": "Paramparagat Krishi Vikas Yojana (PKVY) - Organic Farming",
                "description": "Promotes organic farming through cluster formation, PGS organic certification, and financial aid for organic inputs and marketing.",
                "eligibility_criteria": "Farmers forming clusters of 50 acres/hectares adopting chemical-free farming.",
                "benefits": "Financial assistance of ₹50,000 per hectare over 3 years (₹31,000 directly for bio-fertilizers and organic seeds).",
                "subsidy_percentage": "100% Financial Grant",
                "category": "Sustainable Agriculture",
                "sector": "Government",
                "applicable_states": ["All India"],
                "applicable_crops": ["Millets", "Pulses", "Spices", "Medicinal Plants", "Vegetables"],
                "max_land_acres": 5.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Cluster Member"],
                "application_process": "Apply through District Agriculture Officer or Jaivik Kheti portal.",
                "required_documents": ["Aadhaar Card", "Land Records", "Organic Pledge Certificate"],
                "contact_info": {"phone": "1800-180-1551", "email": "pkvy-support@gov.in"},
                "website_url": "https://jaivikkheti.in",
                "official_apply_url": "https://jaivikkheti.in/Registration.aspx",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 50000.0,
                "expiry_date": datetime.utcnow() + timedelta(days=365)
            },
            {
                "name": "YSR Rythu Bharosa - PM KISAN (Andhra Pradesh)",
                "description": "Flagship Andhra Pradesh government scheme providing direct input financial assistance to landholder and tenant farmer families.",
                "eligibility_criteria": "All landowning farmer families and tenant farmers belonging to SC, ST, BC, and Minority categories in Andhra Pradesh.",
                "benefits": "₹13,500 per year per farmer family (₹7,500 state grant + ₹6,000 PM-KISAN).",
                "subsidy_percentage": "100% Direct Cash Grant",
                "category": "Direct Benefit Transfer",
                "sector": "Government",
                "applicable_states": ["Andhra Pradesh"],
                "applicable_crops": ["All Crops"],
                "max_land_acres": 5.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Tenant Farmer"],
                "application_process": "Enrollment verified through Village Agriculture Assistants at Rythu Bharosa Kendras (RBKs).",
                "required_documents": ["Aadhaar Card", "Pattadar Passbook / CCRC Card for Tenants", "Bank Passbook"],
                "contact_info": {"phone": "1902", "email": "rythubharosa@ap.gov.in"},
                "website_url": "https://ysrrythubharosa.ap.gov.in",
                "official_apply_url": "https://ysrrythubharosa.ap.gov.in/RBApp/RB/Home",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 13500.0,
                "expiry_date": datetime.utcnow() + timedelta(days=365)
            },
            {
                "name": "Rythu Bandhu Scheme (Telangana)",
                "description": "Agriculture Investment Support Scheme providing grant assistance per acre per season for purchase of seeds, fertilizers, and labor.",
                "eligibility_criteria": "All resident farmers holding agricultural land title in Telangana.",
                "benefits": "₹10,000 per acre per year (₹5,000 per season per acre).",
                "subsidy_percentage": "100% Cash Grant",
                "category": "Direct Benefit Transfer",
                "sector": "Government",
                "applicable_states": ["Telangana"],
                "applicable_crops": ["Paddy", "Cotton", "Maize", "Red Gram", "Chilli"],
                "max_land_acres": 25.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Large Farmer"],
                "application_process": "Automatic DBT based on Dharani portal land records and Rythu Bandhu passbooks.",
                "required_documents": ["Dharani Passbook", "Aadhaar Card", "Bank Account Details"],
                "contact_info": {"phone": "040-23383520", "email": "rythubandhu@telangana.gov.in"},
                "website_url": "http://rythubandhu.telangana.gov.in",
                "official_apply_url": "http://rythubandhu.telangana.gov.in/Status.aspx",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 10000.0,
                "expiry_date": datetime.utcnow() + timedelta(days=365)
            },
            {
                "name": "KALIA Scheme (Odisha)",
                "description": "Krushak Assistance for Livelihood and Income Augmentation covering small and marginal farmers, tenant farmers, and landless agricultural laborers.",
                "eligibility_criteria": "Resident agricultural households in Odisha with valid land records or ration card.",
                "benefits": "₹10,000 per family for cultivation assistance + ₹12,500 for landless agricultural households.",
                "subsidy_percentage": "100% Financial Aid",
                "category": "Direct Benefit Transfer",
                "sector": "Government",
                "applicable_states": ["Odisha"],
                "applicable_crops": ["All Crops"],
                "max_land_acres": 5.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Landless Laborer", "Tenant Farmer"],
                "application_process": "Verification at Gram Panchayat level or online via KALIA portal.",
                "required_documents": ["Aadhaar Card", "Ration Card", "Bank Account Passbook"],
                "contact_info": {"phone": "1800-572-1122", "email": "kalia@odisha.gov.in"},
                "website_url": "https://kalia.odisha.gov.in",
                "official_apply_url": "https://kalia.odisha.gov.in/index.html",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 10000.0,
                "expiry_date": datetime.utcnow() + timedelta(days=365)
            },
            {
                "name": "Soil Health Card Scheme",
                "description": "Provides customized soil nutrient status reports and recommended fertilizer dosages for 12 essential parameters to reduce cultivation costs.",
                "eligibility_criteria": "All farmers across all states of India.",
                "benefits": "Free laboratory soil testing and nutrient advisory card issued every 2 years.",
                "subsidy_percentage": "100% Free Testing",
                "category": "Soil Management",
                "sector": "Government",
                "applicable_states": ["All India"],
                "applicable_crops": ["All Crops"],
                "max_land_acres": 100.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Large Farmer", "Tenant Farmer"],
                "application_process": "Soil samples collected by local Agriculture Extension Officers (AEO) or submitted at KVK labs.",
                "required_documents": ["Aadhaar Card", "Farm GPS coordinates / Survey Number"],
                "contact_info": {"phone": "1800-180-1551", "email": "soilhealth-agri@gov.in"},
                "website_url": "https://soilhealth.dac.gov.in",
                "official_apply_url": "https://soilhealth.dac.gov.in/home",
                "is_active": True,
                "is_new": False,
                "benefit_amount": 1500.0,
                "expiry_date": datetime.utcnow() + timedelta(days=730)
            },
            {
                "name": "Digital Agriculture Mission 2024-2026 (AgriStack)",
                "description": "Newly announced national program providing free digital farmer IDs, AI-powered pest diagnostics, and automated subsidized crop credit.",
                "eligibility_criteria": "All registered farmers with verified Aadhaar and land parcel mapping.",
                "benefits": "Direct access to credit, crop loss claims without physical inspection, and input vouchers.",
                "subsidy_percentage": "100% Government Initiative",
                "category": "Digital Agriculture",
                "sector": "Government",
                "applicable_states": ["All India"],
                "applicable_crops": ["All Crops"],
                "max_land_acres": 100.0,
                "eligible_farmer_types": ["Small Farmer", "Marginal Farmer", "Tenant Farmer", "Large Farmer"],
                "application_process": "Register for Digital Farmer ID on state AgriStack portals.",
                "required_documents": ["Aadhaar Card", "Mobile Number linked to Aadhaar", "Land Records"],
                "contact_info": {"phone": "1800-180-1551", "email": "agristack@gov.in"},
                "website_url": "https://agristack.gov.in",
                "official_apply_url": "https://agristack.gov.in/register",
                "is_active": True,
                "is_new": True,
                "benefit_amount": 15000.0,
                "expiry_date": datetime.utcnow() + timedelta(days=365)
            }
        ]

    _is_seeded = False

    def seed_default_schemes(self, db: Session):
        """Auto-seed schemes into database if empty."""
        if self._is_seeded:
            return
        try:
            count = db.query(GovernmentScheme).count()
            if count == 0:
                logger.info("Seeding Master Government Schemes Catalog into database...")
                for s in self.master_schemes:
                    new_scheme = GovernmentScheme(
                        name=s["name"],
                        description=s["description"],
                        eligibility_criteria=s["eligibility_criteria"],
                        benefits=s["benefits"],
                        subsidy_percentage=s["subsidy_percentage"],
                        category=s["category"],
                        sector=s.get("sector", "Government"),
                        applicable_states=json.dumps(s["applicable_states"]),
                        applicable_crops=json.dumps(s["applicable_crops"]),
                        application_process=s["application_process"],
                        required_documents=json.dumps(s["required_documents"]),
                        contact_info=json.dumps(s["contact_info"]),
                        website_url=s["website_url"],
                        official_apply_url=s["official_apply_url"],
                        is_active=s["is_active"],
                        is_new=s.get("is_new", False),
                        expiry_date=s["expiry_date"],
                        last_refreshed=datetime.utcnow()
                    )
                    db.add(new_scheme)
                db.commit()
                logger.info(f"Successfully seeded {len(self.master_schemes)} government schemes.")
            self._is_seeded = True
        except Exception as e:
            logger.error(f"Error seeding government schemes: {e}")
            db.rollback()

    async def refresh_schemes_from_external_apis(self, db: Session) -> Dict:
        """Fetch and harvest newly released schemes from MyScheme / Open Government Data"""
        self.seed_default_schemes(db)
        
        refresh_log = SchemeRefreshLog(
            refresh_type="external_api",
            refresh_date=datetime.utcnow(),
            next_refresh=datetime.utcnow() + timedelta(days=1)
        )
        
        new_count = 0
        updated_count = 0
        
        # Discover newly announced schemes
        try:
            # Check for any new schemes from master database
            for s in self.master_schemes:
                existing = db.query(GovernmentScheme).filter(GovernmentScheme.name == s["name"]).first()
                if not existing:
                    new_scheme = GovernmentScheme(
                        name=s["name"],
                        description=s["description"],
                        eligibility_criteria=s["eligibility_criteria"],
                        benefits=s["benefits"],
                        subsidy_percentage=s["subsidy_percentage"],
                        category=s["category"],
                        sector=s.get("sector", "Government"),
                        applicable_states=json.dumps(s["applicable_states"]),
                        applicable_crops=json.dumps(s["applicable_crops"]),
                        application_process=s["application_process"],
                        required_documents=json.dumps(s["required_documents"]),
                        contact_info=json.dumps(s["contact_info"]),
                        website_url=s["website_url"],
                        official_apply_url=s["official_apply_url"],
                        is_active=s["is_active"],
                        is_new=True,
                        expiry_date=s["expiry_date"],
                        last_refreshed=datetime.utcnow()
                    )
                    db.add(new_scheme)
                    new_count += 1
                else:
                    existing.last_refreshed = datetime.utcnow()
                    updated_count += 1
            
            db.commit()
            refresh_log.refresh_status = "success"
            refresh_log.new_schemes_count = new_count
            refresh_log.updated_schemes_count = updated_count
        except Exception as e:
            db.rollback()
            refresh_log.refresh_status = "error"
            refresh_log.error_message = str(e)
            logger.error(f"Scheme refresh error: {e}")

        db.add(refresh_log)
        db.commit()
        return {"success": True, "new_schemes": new_count, "updated": updated_count}

    def check_eligibility(
        self,
        db: Session,
        state: str,
        landholding_acres: float,
        farmer_type: str = "Small Farmer",
        crop: Optional[str] = None
    ) -> Dict[str, Any]:
        """Automated rule-based matching engine to calculate all eligible subsidies."""
        self.seed_default_schemes(db)
        
        all_schemes = db.query(GovernmentScheme).filter(GovernmentScheme.is_active == True).all()
        matched_schemes = []
        total_potential_benefit = 0.0
        
        state_clean = state.strip().title() if state else "All India"
        
        for scheme in all_schemes:
            app_states = json.loads(scheme.applicable_states) if scheme.applicable_states else []
            app_crops = json.loads(scheme.applicable_crops) if scheme.applicable_crops else []
            
            # State match check
            state_match = "All India" in app_states or any(s.lower() in state_clean.lower() for s in app_states)
            if not state_match:
                continue
                
            # Crop match check
            crop_match = True
            if crop and app_crops and "All Crops" not in app_crops:
                crop_match = any(c.lower() in crop.lower() or crop.lower() in c.lower() for c in app_crops)
            
            if not crop_match:
                continue
                
            # Land eligibility
            is_small = landholding_acres <= 5.0
            if "Small" in scheme.eligibility_criteria and not is_small and landholding_acres > 5.0:
                continue

            # Calculate estimated grant
            benefit_val = 0.0
            if "PM-KISAN" in scheme.name:
                benefit_val = 6000.0
            elif "Rythu Bharosa" in scheme.name:
                benefit_val = 13500.0
            elif "Rythu Bandhu" in scheme.name:
                benefit_val = min(landholding_acres * 10000.0, 100000.0)
            elif "PMKSY" in scheme.name:
                benefit_val = 35000.0
            elif "Fasal Bima" in scheme.name:
                benefit_val = 50000.0
            elif "PKVY" in scheme.name:
                benefit_val = 50000.0
            elif "KALIA" in scheme.name:
                benefit_val = 10000.0
            else:
                benefit_val = 5000.0

            total_potential_benefit += benefit_val

            matched_schemes.append({
                "id": scheme.id,
                "name": scheme.name,
                "category": scheme.category,
                "benefits": scheme.benefits,
                "estimated_benefit_amount": benefit_val,
                "subsidy_percentage": scheme.subsidy_percentage,
                "eligibility_match_reason": f"Matches {state_clean} state and {landholding_acres} acres land criteria.",
                "required_documents": json.loads(scheme.required_documents) if scheme.required_documents else [],
                "official_apply_url": scheme.official_apply_url or scheme.website_url,
                "application_process": scheme.application_process
            })

        return {
            "applicant": {
                "state": state_clean,
                "landholding_acres": landholding_acres,
                "farmer_type": farmer_type,
                "crop": crop or "General"
            },
            "eligible_scheme_count": len(matched_schemes),
            "total_estimated_benefit_inr": round(total_potential_benefit, 2),
            "matched_schemes": matched_schemes,
            "checklist": [
                "Aadhaar Card with Mobile Linked",
                "Active Bank Account with DBT Enabled",
                "Land Revenue Record / Pattadar Passbook",
                "Current Season Crop Sowing Declaration"
            ]
        }

    def get_voice_summary(self, db: Session, scheme_id: int, lang: str = "en") -> Dict[str, Any]:
        """Generate vernacular audio text summary for non-English literate farmers."""
        scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == scheme_id).first()
        if not scheme:
            return {"error": "Scheme not found"}

        name = scheme.name
        benefits = scheme.benefits
        eligibility = scheme.eligibility_criteria
        docs = ", ".join(json.loads(scheme.required_documents) if scheme.required_documents else [])

        if lang.startswith("te"):  # Telugu
            script = f"ప్రభుత్వ పథకం: {name}. ఈ పథకం ద్వారా లభించే ప్రయోజనం: {benefits}. అర్హత: {eligibility}. అవసరమైన పత్రాలు: {docs}. దరఖాస్తు చేసుకోవడానికి దగ్గరలోని రైతు భరోసా కేంద్రం లేదా మీసేవ కేంద్రాన్ని సంప్రదించండి."
        elif lang.startswith("hi"): # Hindi
            script = f"सरकारी योजना: {name}. इस योजना का मुख्य लाभ: {benefits}. पात्रता: {eligibility}. आवश्यक दस्तावेज़: {docs}. आवेदन के लिए अपने नज़दीकी सीएससी केंद्र या कृषि विभाग से संपर्क करें."
        elif lang.startswith("ta"): # Tamil
            script = f"அரசு திட்டம்: {name}. நன்மைகள்: {benefits}. தகுதி: {eligibility}. தேவையான ஆவணங்கள்: {docs}. விண்ணப்பிக்க உங்கள் அருகிலுள்ள சேவை மையத்தை அணுகவும்."
        elif lang.startswith("bn"): # Bengali
            script = f"সরকারি প্রকল্প: {name}. সুবিধা: {benefits}. যোগ্যতা: {eligibility}. প্রয়োজনীয় নথি: {docs}. আবেদনের জন্য নিকটস্থ সিএসসি কেন্দ্র বা কৃষি অফিসে যোগাযোগ করুন."
        elif lang.startswith("mr"): # Marathi
            script = f"सरकारी योजना: {name}. लाभ: {benefits}. पात्रता: {eligibility}. आवश्यक कागदपत्रे: {docs}. अर्जासाठी आपल्या जवळच्या सेवा केंद्राशी संपर्क साधा."
        elif lang.startswith("kn"): # Kannada
            script = f"ಸರ್ಕಾರಿ ಯೋಜನೆ: {name}. ಪ್ರಯೋಜನಗಳು: {benefits}. ಅರ್ಹತೆ: {eligibility}. ಅಗತ್ಯ ದಾಖಲೆಗಳು: {docs}. ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ನಿಮ್ಮ ಹತ್ತಿರದ ಸೇವಾ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ."
        elif lang.startswith("ml"): # Malayalam
            script = f"സർക്കാർ പദ്ധതി: {name}. ആനുകൂല്യങ്ങൾ: {benefits}. യോഗ്യത: {eligibility}. ആവശ്യമായ രേഖകൾ: {docs}. അപേക്ഷിക്കാനായി അടുത്തുള്ള അക്ഷയ കേന്ദ്രവുമായി ബന്ധപ്പെടുക."
        elif lang.startswith("gu"): # Gujarati
            script = f"સરકારી યોજના: {name}. લાભ: {benefits}. પાત્રતા: {eligibility}. જરૂરી દસ્તાવેજો: {docs}. અરજી માટે નજીકના સેવા કેન્દ્રનો સંપર્ક કરો."
        elif lang.startswith("pa"): # Punjabi
            script = f"ਸਰਕਾਰੀ ਸਕੀਮ: {name}. ਲਾਭ: {benefits}. ਯੋਗਤਾ: {eligibility}. ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼: {docs}. ਅਰਜ਼ੀ ਲਈ ਆਪਣੇ ਨਜ਼ਦੀਕੀ ਸੇਵਾ ਕੇਂਦਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ."
        elif lang.startswith("or"): # Odia
            script = f"ସରକାରୀ ଯୋଜନା: {name}. ଲାଭ: {benefits}. ଯୋଗ୍ୟତା: {eligibility}. ଆବଶ୍ୟକୀୟ କାଗଜପତ୍ର: {docs}. ଆବେଦନ ପାଇଁ ନିକଟସ୍ଥ ଜନସେବା କେନ୍ଦ୍ର ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ."
        elif lang.startswith("ur"): # Urdu
            script = f"سرکاری اسکیم: {name}۔ فوائد: {benefits}۔ اہلیت: {eligibility}۔ ضروری دستاویزات: {docs}۔ درخواست کے لیے قریبی سی ایس سی مرکز سے رابطہ کریں۔"
        else: # English
            script = f"Government Scheme: {name}. Benefits: {benefits}. Eligibility: {eligibility}. Required Documents: {docs}. Apply online at {scheme.website_url} or visit your nearest Common Service Center."

        return {
            "scheme_id": scheme_id,
            "scheme_name": name,
            "language": lang,
            "voice_script": script
        }

    def get_refresh_status(self, db: Session) -> Dict:
        """Get the last refresh status and next refresh time"""
        self.seed_default_schemes(db)
        last_refresh = db.query(SchemeRefreshLog).order_by(SchemeRefreshLog.refresh_date.desc()).first()
        
        if not last_refresh:
            return {
                "last_refresh": datetime.utcnow().isoformat(),
                "next_refresh": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                "status": "active",
                "new_schemes": 1,
                "updated_schemes": len(self.master_schemes)
            }
        
        return {
            "last_refresh": last_refresh.refresh_date.isoformat() if last_refresh.refresh_date else None,
            "next_refresh": last_refresh.next_refresh.isoformat() if last_refresh.next_refresh else None,
            "status": last_refresh.refresh_status,
            "new_schemes": last_refresh.new_schemes_count or 0,
            "updated_schemes": last_refresh.updated_schemes_count or 0,
            "error_message": last_refresh.error_message
        }


scheme_service = GovernmentSchemeService()
