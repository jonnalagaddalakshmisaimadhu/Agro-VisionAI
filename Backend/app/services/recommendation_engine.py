import asyncio
import logging
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
from app.services.weather import weather_service
from app.services.open_meteo import open_meteo_service
from app.services.market_prices import MarketPricesService
from app.services.soil_lookup import get_soil_by_district
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class RecommendationEngine:
    def __init__(self):
        self.market_service = MarketPricesService()
        
        # Comprehensive Crop Agronomic Database with Real Agricultural Constants
        # Contains baseline yields (tonnes/ha), seed rate (kg/ha), NPK needs (kg/ha),
        # irrigation hours (hrs/ha), and labor mandays (days/ha)
        self.crop_database: Dict[str, Dict[str, Any]] = {
            # --- 🥦 VEGETABLES ---
            "Tomato": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 28.0,
                "soil_preference": ["Loam", "Sandy Loam", "Red Soil", "Black Soil"],
                "season": ["Kharif", "Rabi", "Summer", "All"],
                "duration_days": (90, 115),
                "seed_rate_kg_ha": 0.4,
                "seed_price_per_kg": 25000.0,
                "npk_needs_kg": (120, 80, 100),
                "irrigation_hrs_ha": 180,
                "labor_mandays_ha": 85,
                "machinery_hrs_ha": 18,
                "water_needs": "High",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 25.0
            },
            "Potato": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 22.0,
                "soil_preference": ["Loam", "Sandy Loam", "Clay Loam", "Alluvial Soil"],
                "season": ["Rabi", "Winter"],
                "duration_days": (90, 120),
                "seed_rate_kg_ha": 2000.0,
                "seed_price_per_kg": 20.0,
                "npk_needs_kg": (150, 100, 120),
                "irrigation_hrs_ha": 140,
                "labor_mandays_ha": 65,
                "machinery_hrs_ha": 22,
                "water_needs": "Medium",
                "pest_risk": "High",
                "benchmark_price_per_kg": 18.0
            },
            "Onion": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 25.0,
                "soil_preference": ["Loam", "Clay Loam", "Alluvial Soil", "Red Soil"],
                "season": ["Rabi", "Kharif", "Summer"],
                "duration_days": (100, 135),
                "seed_rate_kg_ha": 8.0,
                "seed_price_per_kg": 2200.0,
                "npk_needs_kg": (100, 50, 80),
                "irrigation_hrs_ha": 160,
                "labor_mandays_ha": 90,
                "machinery_hrs_ha": 16,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 24.0
            },
            "Garlic": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 8.0,
                "soil_preference": ["Loam", "Sandy Loam", "Clay Loam"],
                "season": ["Rabi"],
                "duration_days": (120, 150),
                "seed_rate_kg_ha": 500.0,
                "seed_price_per_kg": 100.0,
                "npk_needs_kg": (100, 50, 50),
                "irrigation_hrs_ha": 120,
                "labor_mandays_ha": 70,
                "machinery_hrs_ha": 14,
                "water_needs": "Medium",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 110.0
            },
            "Ginger": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 15.0,
                "soil_preference": ["Sandy Loam", "Clay Loam", "Red Soil"],
                "season": ["Kharif", "Summer"],
                "duration_days": (210, 260),
                "seed_rate_kg_ha": 1500.0,
                "seed_price_per_kg": 50.0,
                "npk_needs_kg": (100, 50, 100),
                "irrigation_hrs_ha": 200,
                "labor_mandays_ha": 95,
                "machinery_hrs_ha": 15,
                "water_needs": "High",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 65.0
            },
            "Green Chilli": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 12.0,
                "soil_preference": ["Black Soil", "Loam", "Clay Loam"],
                "season": ["Kharif", "Rabi", "Summer"],
                "duration_days": (120, 160),
                "seed_rate_kg_ha": 1.0,
                "seed_price_per_kg": 15000.0,
                "npk_needs_kg": (120, 60, 60),
                "irrigation_hrs_ha": 150,
                "labor_mandays_ha": 80,
                "machinery_hrs_ha": 15,
                "water_needs": "Medium",
                "pest_risk": "High",
                "benchmark_price_per_kg": 40.0
            },
            "Capsicum": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 20.0,
                "soil_preference": ["Loam", "Sandy Loam", "Red Soil"],
                "season": ["Kharif", "Rabi", "All"],
                "duration_days": (100, 130),
                "seed_rate_kg_ha": 0.5,
                "seed_price_per_kg": 35000.0,
                "npk_needs_kg": (150, 90, 90),
                "irrigation_hrs_ha": 220,
                "labor_mandays_ha": 75,
                "machinery_hrs_ha": 16,
                "water_needs": "High",
                "pest_risk": "High",
                "benchmark_price_per_kg": 45.0
            },
            "Bell Pepper": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 22.0,
                "soil_preference": ["Loam", "Sandy Loam"],
                "season": ["All", "Kharif", "Rabi"],
                "duration_days": (100, 120),
                "seed_rate_kg_ha": 0.5,
                "seed_price_per_kg": 35000.0,
                "npk_needs_kg": (150, 90, 90),
                "irrigation_hrs_ha": 220,
                "labor_mandays_ha": 75,
                "machinery_hrs_ha": 16,
                "water_needs": "High",
                "pest_risk": "High",
                "benchmark_price_per_kg": 45.0
            },
            "Brinjal": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 25.0,
                "soil_preference": ["Loam", "Sandy Loam", "Black Soil"],
                "season": ["Kharif", "Rabi", "Summer"],
                "duration_days": (110, 140),
                "seed_rate_kg_ha": 0.4,
                "seed_price_per_kg": 18000.0,
                "npk_needs_kg": (100, 60, 50),
                "irrigation_hrs_ha": 140,
                "labor_mandays_ha": 70,
                "machinery_hrs_ha": 14,
                "water_needs": "Medium",
                "pest_risk": "High",
                "benchmark_price_per_kg": 22.0
            },
            "Okra": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 14.0,
                "soil_preference": ["Loam", "Sandy Loam", "Clay Loam"],
                "season": ["Kharif", "Summer"],
                "duration_days": (80, 100),
                "seed_rate_kg_ha": 12.0,
                "seed_price_per_kg": 800.0,
                "npk_needs_kg": (100, 50, 50),
                "irrigation_hrs_ha": 130,
                "labor_mandays_ha": 65,
                "machinery_hrs_ha": 14,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 30.0
            },
            "Cabbage": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 30.0,
                "soil_preference": ["Loam", "Sandy Loam", "Clay Loam"],
                "season": ["Rabi", "Winter"],
                "duration_days": (80, 110),
                "seed_rate_kg_ha": 0.5,
                "seed_price_per_kg": 15000.0,
                "npk_needs_kg": (120, 60, 60),
                "irrigation_hrs_ha": 120,
                "labor_mandays_ha": 60,
                "machinery_hrs_ha": 15,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 16.0
            },
            "Cauliflower": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 22.0,
                "soil_preference": ["Loam", "Sandy Loam", "Clay Loam"],
                "season": ["Rabi", "Winter"],
                "duration_days": (85, 115),
                "seed_rate_kg_ha": 0.5,
                "seed_price_per_kg": 18000.0,
                "npk_needs_kg": (120, 80, 80),
                "irrigation_hrs_ha": 130,
                "labor_mandays_ha": 65,
                "machinery_hrs_ha": 15,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 25.0
            },
            "Carrot": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 25.0,
                "soil_preference": ["Sandy Loam", "Loam", "Alluvial Soil"],
                "season": ["Rabi", "Winter"],
                "duration_days": (85, 110),
                "seed_rate_kg_ha": 6.0,
                "seed_price_per_kg": 1200.0,
                "npk_needs_kg": (80, 50, 80),
                "irrigation_hrs_ha": 110,
                "labor_mandays_ha": 55,
                "machinery_hrs_ha": 15,
                "water_needs": "Medium",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 20.0
            },
            "Spinach": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 15.0,
                "soil_preference": ["Loam", "Sandy Loam", "Alluvial Soil"],
                "season": ["Rabi", "All"],
                "duration_days": (35, 55),
                "seed_rate_kg_ha": 30.0,
                "seed_price_per_kg": 250.0,
                "npk_needs_kg": (60, 30, 30),
                "irrigation_hrs_ha": 80,
                "labor_mandays_ha": 45,
                "machinery_hrs_ha": 10,
                "water_needs": "Medium",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 22.0
            },
            "Cucumber": {
                "category": "Vegetables",
                "base_yield_t_per_ha": 18.0,
                "soil_preference": ["Sandy Loam", "Loam"],
                "season": ["Summer", "Kharif"],
                "duration_days": (60, 80),
                "seed_rate_kg_ha": 2.5,
                "seed_price_per_kg": 4000.0,
                "npk_needs_kg": (80, 50, 50),
                "irrigation_hrs_ha": 120,
                "labor_mandays_ha": 55,
                "machinery_hrs_ha": 12,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 20.0
            },

            # --- 🍎 FRUITS ---
            "Banana": {
                "category": "Fruits",
                "base_yield_t_per_ha": 55.0,
                "soil_preference": ["Loam", "Clay Loam", "Alluvial Soil", "Red Soil"],
                "season": ["All", "Kharif"],
                "duration_days": (330, 390),
                "seed_rate_kg_ha": 2500.0,  # suckers/plants
                "seed_price_per_kg": 15.0,
                "npk_needs_kg": (200, 100, 300),
                "irrigation_hrs_ha": 350,
                "labor_mandays_ha": 120,
                "machinery_hrs_ha": 25,
                "water_needs": "Very High",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 18.0
            },
            "Mango": {
                "category": "Fruits",
                "base_yield_t_per_ha": 12.0,
                "soil_preference": ["Loam", "Alluvial Soil", "Red Soil", "Laterite Soil"],
                "season": ["Summer", "All"],
                "duration_days": (120, 150),
                "seed_rate_kg_ha": 100.0,
                "seed_price_per_kg": 150.0,
                "npk_needs_kg": (100, 50, 100),
                "irrigation_hrs_ha": 160,
                "labor_mandays_ha": 65,
                "machinery_hrs_ha": 18,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 50.0
            },
            "Papaya": {
                "category": "Fruits",
                "base_yield_t_per_ha": 60.0,
                "soil_preference": ["Sandy Loam", "Loam", "Alluvial Soil"],
                "season": ["All", "Kharif"],
                "duration_days": (270, 330),
                "seed_rate_kg_ha": 0.5,
                "seed_price_per_kg": 40000.0,
                "npk_needs_kg": (200, 150, 200),
                "irrigation_hrs_ha": 250,
                "labor_mandays_ha": 85,
                "machinery_hrs_ha": 18,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 20.0
            },
            "Watermelon": {
                "category": "Fruits",
                "base_yield_t_per_ha": 40.0,
                "soil_preference": ["Sandy Loam", "Loam", "Alluvial Soil"],
                "season": ["Summer", "Zaid"],
                "duration_days": (80, 100),
                "seed_rate_kg_ha": 3.5,
                "seed_price_per_kg": 3500.0,
                "npk_needs_kg": (100, 50, 50),
                "irrigation_hrs_ha": 140,
                "labor_mandays_ha": 55,
                "machinery_hrs_ha": 14,
                "water_needs": "Medium",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 12.0
            },
            "Pomegranate": {
                "category": "Fruits",
                "base_yield_t_per_ha": 15.0,
                "soil_preference": ["Loam", "Sandy Loam", "Black Soil"],
                "season": ["All", "Rabi"],
                "duration_days": (150, 180),
                "seed_rate_kg_ha": 600.0,
                "seed_price_per_kg": 45.0,
                "npk_needs_kg": (150, 100, 150),
                "irrigation_hrs_ha": 200,
                "labor_mandays_ha": 80,
                "machinery_hrs_ha": 20,
                "water_needs": "Low",
                "pest_risk": "High",
                "benchmark_price_per_kg": 90.0
            },
            "Dragon Fruit": {
                "category": "Fruits",
                "base_yield_t_per_ha": 14.0,
                "soil_preference": ["Sandy Loam", "Loam", "Red Soil"],
                "season": ["All", "Summer"],
                "duration_days": (150, 180),
                "seed_rate_kg_ha": 1500.0,
                "seed_price_per_kg": 60.0,
                "npk_needs_kg": (120, 80, 120),
                "irrigation_hrs_ha": 150,
                "labor_mandays_ha": 70,
                "machinery_hrs_ha": 15,
                "water_needs": "Low",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 130.0
            },
            "Guava": {
                "category": "Fruits",
                "base_yield_t_per_ha": 20.0,
                "soil_preference": ["Loam", "Clay Loam", "Alluvial Soil", "Red Soil"],
                "season": ["All", "Kharif", "Rabi"],
                "duration_days": (120, 150),
                "seed_rate_kg_ha": 300.0,
                "seed_price_per_kg": 50.0,
                "npk_needs_kg": (100, 60, 60),
                "irrigation_hrs_ha": 150,
                "labor_mandays_ha": 60,
                "machinery_hrs_ha": 15,
                "water_needs": "Low",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 35.0
            },
            "Grapes": {
                "category": "Fruits",
                "base_yield_t_per_ha": 22.0,
                "soil_preference": ["Sandy Loam", "Loam", "Red Soil"],
                "season": ["Rabi", "Winter"],
                "duration_days": (130, 160),
                "seed_rate_kg_ha": 1500.0,
                "seed_price_per_kg": 35.0,
                "npk_needs_kg": (200, 100, 200),
                "irrigation_hrs_ha": 280,
                "labor_mandays_ha": 110,
                "machinery_hrs_ha": 22,
                "water_needs": "Medium",
                "pest_risk": "High",
                "benchmark_price_per_kg": 60.0
            },
            "Apple": {
                "category": "Fruits",
                "base_yield_t_per_ha": 15.0,
                "soil_preference": ["Loam", "Clay Loam", "Mountain Soil"],
                "season": ["Summer", "Autumn"],
                "duration_days": (150, 180),
                "seed_rate_kg_ha": 400.0,
                "seed_price_per_kg": 120.0,
                "npk_needs_kg": (120, 60, 120),
                "irrigation_hrs_ha": 160,
                "labor_mandays_ha": 90,
                "machinery_hrs_ha": 20,
                "water_needs": "Medium",
                "pest_risk": "High",
                "benchmark_price_per_kg": 90.0
            },

            # --- 🌾 CEREALS & GRAINS ---
            "Rice": {
                "category": "Grains & Millets",
                "base_yield_t_per_ha": 5.2,
                "soil_preference": ["Clay", "Clay Loam", "Alluvial Soil", "Black Soil"],
                "season": ["Kharif", "Rabi"],
                "duration_days": (120, 150),
                "seed_rate_kg_ha": 40.0,
                "seed_price_per_kg": 50.0,
                "npk_needs_kg": (120, 60, 40),
                "irrigation_hrs_ha": 350,
                "labor_mandays_ha": 50,
                "machinery_hrs_ha": 16,
                "water_needs": "Very High",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 23.0
            },
            "Wheat": {
                "category": "Grains & Millets",
                "base_yield_t_per_ha": 4.8,
                "soil_preference": ["Loam", "Clay Loam", "Alluvial Soil"],
                "season": ["Rabi"],
                "duration_days": (115, 140),
                "seed_rate_kg_ha": 100.0,
                "seed_price_per_kg": 40.0,
                "npk_needs_kg": (120, 60, 40),
                "irrigation_hrs_ha": 140,
                "labor_mandays_ha": 30,
                "machinery_hrs_ha": 16,
                "water_needs": "Medium",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 24.5
            },
            "Maize": {
                "category": "Grains & Millets",
                "base_yield_t_per_ha": 7.0,
                "soil_preference": ["Loam", "Sandy Loam", "Clay Loam", "Red Soil"],
                "season": ["Kharif", "Rabi", "Summer"],
                "duration_days": (95, 115),
                "seed_rate_kg_ha": 20.0,
                "seed_price_per_kg": 250.0,
                "npk_needs_kg": (120, 60, 40),
                "irrigation_hrs_ha": 130,
                "labor_mandays_ha": 35,
                "machinery_hrs_ha": 15,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 22.0
            },
            "Bajra": {
                "category": "Grains & Millets",
                "base_yield_t_per_ha": 2.8,
                "soil_preference": ["Sandy Loam", "Sandy Soil", "Red Soil"],
                "season": ["Kharif", "Summer"],
                "duration_days": (80, 95),
                "seed_rate_kg_ha": 4.0,
                "seed_price_per_kg": 300.0,
                "npk_needs_kg": (80, 40, 40),
                "irrigation_hrs_ha": 60,
                "labor_mandays_ha": 25,
                "machinery_hrs_ha": 12,
                "water_needs": "Low",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 25.0
            },
            "Ragi": {
                "category": "Grains & Millets",
                "base_yield_t_per_ha": 3.0,
                "soil_preference": ["Red Soil", "Sandy Loam", "Loam"],
                "season": ["Kharif", "Rabi"],
                "duration_days": (100, 120),
                "seed_rate_kg_ha": 10.0,
                "seed_price_per_kg": 150.0,
                "npk_needs_kg": (60, 30, 30),
                "irrigation_hrs_ha": 70,
                "labor_mandays_ha": 30,
                "machinery_hrs_ha": 12,
                "water_needs": "Low",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 38.0
            },

            # --- 🫘 PULSES & LEGUMES ---
            "Chickpea": {
                "category": "Pulses & Legumes",
                "base_yield_t_per_ha": 2.2,
                "soil_preference": ["Black Soil", "Clay Loam", "Loam"],
                "season": ["Rabi"],
                "duration_days": (95, 115),
                "seed_rate_kg_ha": 75.0,
                "seed_price_per_kg": 90.0,
                "npk_needs_kg": (20, 50, 20),
                "irrigation_hrs_ha": 60,
                "labor_mandays_ha": 30,
                "machinery_hrs_ha": 14,
                "water_needs": "Low",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 60.0
            },
            "Pigeon Pea": {
                "category": "Pulses & Legumes",
                "base_yield_t_per_ha": 1.8,
                "soil_preference": ["Black Soil", "Loam", "Red Soil"],
                "season": ["Kharif"],
                "duration_days": (160, 200),
                "seed_rate_kg_ha": 15.0,
                "seed_price_per_kg": 140.0,
                "npk_needs_kg": (25, 50, 0),
                "irrigation_hrs_ha": 60,
                "labor_mandays_ha": 35,
                "machinery_hrs_ha": 14,
                "water_needs": "Low",
                "pest_risk": "High",
                "benchmark_price_per_kg": 75.0
            },
            "Green Gram": {
                "category": "Pulses & Legumes",
                "base_yield_t_per_ha": 1.2,
                "soil_preference": ["Loam", "Sandy Loam", "Alluvial Soil"],
                "season": ["Kharif", "Summer"],
                "duration_days": (65, 80),
                "seed_rate_kg_ha": 20.0,
                "seed_price_per_kg": 120.0,
                "npk_needs_kg": (20, 40, 20),
                "irrigation_hrs_ha": 50,
                "labor_mandays_ha": 25,
                "machinery_hrs_ha": 12,
                "water_needs": "Low",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 85.0
            },
            "Soybean": {
                "category": "Pulses & Legumes",
                "base_yield_t_per_ha": 2.5,
                "soil_preference": ["Black Soil", "Clay Loam", "Loam"],
                "season": ["Kharif"],
                "duration_days": (90, 105),
                "seed_rate_kg_ha": 65.0,
                "seed_price_per_kg": 80.0,
                "npk_needs_kg": (30, 60, 40),
                "irrigation_hrs_ha": 60,
                "labor_mandays_ha": 30,
                "machinery_hrs_ha": 14,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 46.0
            },

            # --- 🌻 OILSEEDS & SPICES ---
            "Mustard": {
                "category": "Oilseeds & Spices",
                "base_yield_t_per_ha": 2.2,
                "soil_preference": ["Loam", "Sandy Loam", "Alluvial Soil"],
                "season": ["Rabi"],
                "duration_days": (105, 125),
                "seed_rate_kg_ha": 5.0,
                "seed_price_per_kg": 250.0,
                "npk_needs_kg": (80, 40, 40),
                "irrigation_hrs_ha": 70,
                "labor_mandays_ha": 28,
                "machinery_hrs_ha": 14,
                "water_needs": "Low",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 56.0
            },
            "Groundnut": {
                "category": "Oilseeds & Spices",
                "base_yield_t_per_ha": 2.6,
                "soil_preference": ["Sandy Loam", "Red Soil", "Loam"],
                "season": ["Kharif", "Summer"],
                "duration_days": (105, 125),
                "seed_rate_kg_ha": 120.0,
                "seed_price_per_kg": 90.0,
                "npk_needs_kg": (25, 50, 75),
                "irrigation_hrs_ha": 110,
                "labor_mandays_ha": 45,
                "machinery_hrs_ha": 16,
                "water_needs": "Medium",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 65.0
            },
            "Turmeric": {
                "category": "Oilseeds & Spices",
                "base_yield_t_per_ha": 24.0,
                "soil_preference": ["Loam", "Clay Loam", "Red Soil"],
                "season": ["Kharif"],
                "duration_days": (240, 270),
                "seed_rate_kg_ha": 2000.0,
                "seed_price_per_kg": 25.0,
                "npk_needs_kg": (120, 60, 120),
                "irrigation_hrs_ha": 220,
                "labor_mandays_ha": 95,
                "machinery_hrs_ha": 18,
                "water_needs": "High",
                "pest_risk": "Low",
                "benchmark_price_per_kg": 72.0
            },

            # --- 🎋 CASH & PLANTATION ---
            "Cotton": {
                "category": "Cash & Plantation",
                "base_yield_t_per_ha": 2.8,
                "soil_preference": ["Black Soil", "Clay Loam", "Alluvial Soil"],
                "season": ["Kharif"],
                "duration_days": (160, 190),
                "seed_rate_kg_ha": 3.5,
                "seed_price_per_kg": 2500.0,
                "npk_needs_kg": (120, 60, 60),
                "irrigation_hrs_ha": 160,
                "labor_mandays_ha": 65,
                "machinery_hrs_ha": 18,
                "water_needs": "High",
                "pest_risk": "High",
                "benchmark_price_per_kg": 72.0
            },
            "Sugarcane": {
                "category": "Cash & Plantation",
                "base_yield_t_per_ha": 85.0,
                "soil_preference": ["Black Soil", "Loam", "Clay Loam", "Alluvial Soil"],
                "season": ["Kharif", "All"],
                "duration_days": (330, 420),
                "seed_rate_kg_ha": 7500.0,
                "seed_price_per_kg": 3.5,
                "npk_needs_kg": (250, 100, 120),
                "irrigation_hrs_ha": 400,
                "labor_mandays_ha": 80,
                "machinery_hrs_ha": 25,
                "water_needs": "Very High",
                "pest_risk": "Medium",
                "benchmark_price_per_kg": 3.8
            }
        }

    def _get_crop_profile(self, crop_name: str) -> Dict[str, Any]:
        """Resolves crop to profile or generates a dynamic mathematical profile for ANY custom crop."""
        for key, val in self.crop_database.items():
            if key.lower() == crop_name.strip().lower():
                return {**val, "name": key}
        
        for key, val in self.crop_database.items():
            if key.lower() in crop_name.strip().lower() or crop_name.strip().lower() in key.lower():
                return {**val, "name": key}

        # Dynamic fallback for exotic/custom crop based on nomenclature
        c_lower = crop_name.strip().lower()
        if any(f in c_lower for f in ["fruit", "berry", "melon", "apple", "mango", "citrus", "orange", "grape", "avocado", "fig"]):
            category = "Fruits"
            base_yield = 16.0
            seed_cost_ha = 25000.0
            npk = (120, 80, 120)
            irrig_hrs = 180
            labor_days = 70
            price = 65.0
            dur = (120, 180)
            water = "Medium"
        elif any(g in c_lower for g in ["grain", "rice", "paddy", "wheat", "millet", "oat", "corn", "barley"]):
            category = "Grains & Millets"
            base_yield = 4.5
            seed_cost_ha = 4500.0
            npk = (100, 50, 40)
            irrig_hrs = 120
            labor_days = 35
            price = 26.0
            dur = (100, 130)
            water = "Medium"
        elif any(p in c_lower for p in ["dal", "gram", "pulse", "pea", "bean", "lentil"]):
            category = "Pulses & Legumes"
            base_yield = 1.8
            seed_cost_ha = 6500.0
            npk = (25, 50, 20)
            irrig_hrs = 60
            labor_days = 30
            price = 72.0
            dur = (80, 110)
            water = "Low"
        elif any(s in c_lower for s in ["spice", "chilli", "pepper", "seed", "turmeric", "cumin"]):
            category = "Oilseeds & Spices"
            base_yield = 2.0
            seed_cost_ha = 8000.0
            npk = (60, 40, 40)
            irrig_hrs = 80
            labor_days = 40
            price = 95.0
            dur = (90, 130)
            water = "Low"
        elif any(c in c_lower for c in ["cotton", "cane", "coffee", "tea", "rubber"]):
            category = "Cash & Plantation"
            base_yield = 5.0
            seed_cost_ha = 15000.0
            npk = (150, 80, 80)
            irrig_hrs = 200
            labor_days = 75
            price = 68.0
            dur = (150, 240)
            water = "High"
        else:
            category = "Vegetables"
            base_yield = 18.0
            seed_cost_ha = 12000.0
            npk = (100, 60, 60)
            irrig_hrs = 140
            labor_days = 60
            price = 32.0
            dur = (75, 105)
            water = "Medium"

        return {
            "name": crop_name.strip().title(),
            "category": category,
            "base_yield_t_per_ha": base_yield,
            "soil_preference": ["Loam", "Sandy Loam", "Alluvial Soil", "Black Soil"],
            "season": ["All", "Kharif", "Rabi", "Summer"],
            "duration_days": dur,
            "seed_rate_kg_ha": 1.0,
            "seed_price_per_kg": seed_cost_ha,
            "npk_needs_kg": npk,
            "irrigation_hrs_ha": irrig_hrs,
            "labor_mandays_ha": labor_days,
            "machinery_hrs_ha": 15,
            "water_needs": water,
            "pest_risk": "Medium",
            "benchmark_price_per_kg": price
        }

    def compute_dynamic_cost(self, profile: Dict[str, Any], area_ha: float) -> Dict[str, float]:
        """
        Calculates realistic, itemized production cost based on exact agronomic formulas
        using standard Indian agricultural input prices.
        """
        # 1. Seeds Cost
        seed_rate = profile.get("seed_rate_kg_ha", 1.0)
        seed_price = profile.get("seed_price_per_kg", 500.0)
        seeds_cost = seed_rate * seed_price * area_ha

        # 2. Fertilizer Cost (Based on NPK kg/ha with Urea ₹6/kg, DAP ₹27/kg, MOP ₹34/kg)
        n, p, k = profile.get("npk_needs_kg", (100, 50, 50))
        urea_cost = (n / 0.46) * 6.0 * area_ha
        dap_cost = (p / 0.46) * 27.0 * area_ha
        mop_cost = (k / 0.60) * 34.0 * area_ha
        fertilizer_cost = urea_cost + dap_cost + mop_cost + (1500.0 * area_ha) # Micronutrients/Biofertilizers

        # 3. Irrigation Cost (Electricity @ ₹3.5/hr or Diesel pump @ ₹75/hr average ₹25/hr)
        irrig_hrs = profile.get("irrigation_hrs_ha", 120)
        irrigation_cost = irrig_hrs * 30.0 * area_ha

        # 4. Labor Cost (Daily agricultural wage @ ₹450/manday in India)
        mandays = profile.get("labor_mandays_ha", 50)
        labor_cost = mandays * 450.0 * area_ha

        # 5. Machinery Cost (Tractor plowing, tilling, spraying, harvesting @ ₹800/hr)
        machinery_hrs = profile.get("machinery_hrs_ha", 15)
        machinery_cost = machinery_hrs * 800.0 * area_ha

        total = seeds_cost + fertilizer_cost + irrigation_cost + labor_cost + machinery_cost

        return {
            "seeds": round(seeds_cost, 2),
            "fertilizer": round(fertilizer_cost, 2),
            "irrigation": round(irrigation_cost, 2),
            "labor": round(labor_cost, 2),
            "machinery": round(machinery_cost, 2),
            "total": round(total, 2)
        }

    def compute_dynamic_yield(
        self,
        profile: Dict[str, Any],
        weather: Dict,
        soil: Dict,
        season: str,
        irrigation_type: Optional[str] = None
    ) -> float:
        """
        Dynamically calculates actual yield (tonnes/ha) as a mathematical function of
        weather telemetry, soil compatibility, and irrigation method.
        """
        base_yield = profile.get("base_yield_t_per_ha", 5.0)

        # 1. Soil Suitability Factor
        soil_type = soil.get("soil_type", "Loam")
        preferred_soils = profile.get("soil_preference", ["Loam"])
        f_soil = 1.05 if any(ps.lower() in soil_type.lower() for ps in preferred_soils) else 0.92

        # 2. Weather Suitability Factor
        temp = weather.get("main", {}).get("temp", 26.0)
        humidity = weather.get("main", {}).get("humidity", 60.0)
        
        # Temperature curve penalty
        if 20.0 <= temp <= 32.0:
            f_temp = 1.05
        elif 15.0 <= temp < 20.0 or 32.0 < temp <= 38.0:
            f_temp = 0.95
        else:
            f_temp = 0.85

        # Humidity curve
        if 40.0 <= humidity <= 75.0:
            f_hum = 1.02
        else:
            f_hum = 0.96

        f_weather = f_temp * f_hum

        # 3. Irrigation Factor
        it = (irrigation_type or "drip").lower()
        if "drip" in it:
            f_irrig = 1.20  # +20% yield efficiency
        elif "sprinkler" in it:
            f_irrig = 1.10
        elif "rainfed" in it:
            f_irrig = 0.78  # -22% dryland penalty
        else:
            f_irrig = 1.00

        # Calculated dynamic yield
        actual_yield = base_yield * f_soil * f_weather * f_irrig
        return round(max(actual_yield, 0.5), 2)

    async def get_recommendations(
        self,
        district: str,
        area_ha: float,
        season: str,
        db: Session,
        desired_crops: Optional[List[str]] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        budget: Optional[float] = None,
        irrigation_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        100% Dynamic Recommendation Engine with zero hardcoded outputs.
        """
        start_time = datetime.utcnow()
        request_id = f"rec_{int(start_time.timestamp())}"
        
        try:
            candidates = []
            if desired_crops and len(desired_crops) > 0:
                candidates = [c.strip() for c in desired_crops if c.strip()]
            else:
                candidates = list(self.crop_database.keys())
            
            # Real-time weather, soil & mandi price fetch
            weather_data, soil_info, market_prices = await asyncio.gather(
                self._fetch_weather_safe(lat, lon, district),
                self._fetch_soil_safe(district),
                self._fetch_market_prices_safe(candidates, district, db),
                return_exceptions=True
            )
            
            weather_data = weather_data if not isinstance(weather_data, Exception) else {}
            soil_info = soil_info if not isinstance(soil_info, Exception) else {}
            market_prices = market_prices if not isinstance(market_prices, Exception) else {}
            
            recommendations = []
            for crop in candidates:
                rec_data = self._calculate_crop_financials(
                    crop=crop,
                    district=district,
                    season=season,
                    area_ha=area_ha,
                    weather=weather_data,
                    soil=soil_info,
                    prices=market_prices,
                    budget=budget,
                    irrigation_type=irrigation_type
                )
                recommendations.append(rec_data)
            
            # Sort by profitability
            recommendations.sort(key=lambda x: x["final_score"], reverse=True)
            
            limit = len(candidates) if desired_crops else 12
            top_recommendations = recommendations[:limit]
            
            elapsed_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return {
                "request_id": request_id,
                "status": "success",
                "location": {"district": district, "lat": lat, "lon": lon},
                "area_ha": area_ha,
                "season": season,
                "recommendations": top_recommendations,
                "metadata": {
                    "elapsed_ms": elapsed_ms,
                    "recommendation_count": len(top_recommendations),
                    "total_evaluated": len(candidates),
                    "timestamp": start_time.isoformat()
                }
            }
        
        except Exception as e:
            logger.exception(f"Error in get_recommendations: {str(e)}")
            return {
                "request_id": request_id,
                "status": "error",
                "error": str(e),
                "recommendations": []
            }

    async def _fetch_weather_safe(self, lat: Optional[float], lon: Optional[float], district: str) -> Dict:
        try:
            if lat and lon:
                return await weather_service.get_forecast_by_coordinates(lat, lon)
            return await weather_service.get_weather_by_city(district)
        except Exception as e:
            logger.warning(f"Live weather fetch fallback: {e}")
            return {"main": {"temp": 26.0, "humidity": 60.0}}

    async def _fetch_soil_safe(self, district: str) -> Dict:
        try:
            soil_type = get_soil_by_district(district)
            return {"soil_type": soil_type if soil_type else "Loam", "district": district}
        except Exception as e:
            return {"soil_type": "Loam", "district": district}

    async def _fetch_market_prices_safe(self, crops: List[str], district: str, db: Session) -> Dict:
        try:
            prices = {}
            for crop in crops:
                profile = self._get_crop_profile(crop)
                default_price = profile.get("benchmark_price_per_kg", 25.0)
                
                market_records = self.market_service.get_market_prices(db, location=district, limit=1)
                crop_price = None
                
                for record in market_records:
                    if record.crop_name.lower() in crop.lower() or crop.lower() in record.crop_name.lower():
                        crop_price = record.current_price / 100.0 if record.current_price > 200 else record.current_price
                        break
                
                if not crop_price:
                    fb = self.market_service.fallback_prices.get(crop)
                    if fb:
                        p = fb.get("price", default_price * 100)
                        crop_price = p / 100.0 if p > 200 else p
                    else:
                        crop_price = default_price
                
                prices[crop] = {"price_per_kg": float(crop_price)}
            
            return prices
        except Exception as e:
            return {crop: {"price_per_kg": self._get_crop_profile(crop).get("benchmark_price_per_kg", 25.0)} for crop in crops}

    def _calculate_crop_financials(
        self,
        crop: str,
        district: str,
        season: str,
        area_ha: float,
        weather: Dict,
        soil: Dict,
        prices: Dict,
        budget: Optional[float],
        irrigation_type: Optional[str]
    ) -> Dict[str, Any]:
        """Calculates 100% dynamic mathematical financial metrics."""
        profile = self._get_crop_profile(crop)
        canonical_name = profile.get("name", crop)
        category = profile.get("category", "General")

        # 1. Dynamic Yield calculation
        yield_t_per_ha = self.compute_dynamic_yield(profile, weather, soil, season, irrigation_type)
        yield_total_kg = yield_t_per_ha * 1000.0 * area_ha

        # 2. Dynamic Price
        price_per_kg = prices.get(crop, {}).get("price_per_kg", profile.get("benchmark_price_per_kg", 25.0))
        price_per_quintal = price_per_kg * 100.0

        # 3. Dynamic Cost Calculation
        cost_breakdown = self.compute_dynamic_cost(profile, area_ha)
        total_investment = cost_breakdown["total"]

        # 4. Revenue & Profit
        revenue = price_per_kg * yield_total_kg
        profit = revenue - total_investment
        profit_per_ha = profit / area_ha if area_ha > 0 else 0.0

        # 5. Break-Even Price
        break_even_per_kg = (total_investment / yield_total_kg) if yield_total_kg > 0 else 0.0
        break_even_per_quintal = break_even_per_kg * 100.0

        # 6. ROI & B:C Ratio
        roi_percent = ((profit / total_investment) * 100.0) if total_investment > 0 else 0.0
        bc_ratio = (revenue / total_investment) if total_investment > 0 else 0.0

        # 7. 3-Scenario Risk Matrix
        scenarios = {
            "best_case": {
                "yield_t_per_ha": round(yield_t_per_ha * 1.18, 2),
                "price_per_kg": round(price_per_kg * 1.15, 2),
                "revenue": round(revenue * 1.357, 2),
                "profit": round((revenue * 1.357) - total_investment, 2),
                "roi_percent": round((((revenue * 1.357) - total_investment) / total_investment) * 100.0, 1)
            },
            "realistic": {
                "yield_t_per_ha": round(yield_t_per_ha, 2),
                "price_per_kg": round(price_per_kg, 2),
                "revenue": round(revenue, 2),
                "profit": round(profit, 2),
                "roi_percent": round(roi_percent, 1)
            },
            "worst_case": {
                "yield_t_per_ha": round(yield_t_per_ha * 0.82, 2),
                "price_per_kg": round(price_per_kg * 0.85, 2),
                "revenue": round(revenue * 0.697, 2),
                "profit": round((revenue * 0.697) - total_investment, 2),
                "roi_percent": round((((revenue * 0.697) - total_investment) / total_investment) * 100.0, 1)
            }
        }

        # Profitability Tier
        if profit_per_ha >= 100000:
            profitability = "High Profit"
        elif profit_per_ha >= 35000:
            profitability = "Medium Profit"
        else:
            profitability = "Low Profit"

        # Suitability scores
        soil_score = 1.0 if any(ps.lower() in soil.get("soil_type", "Loam").lower() for ps in profile.get("soil_preference", [])) else 0.75
        season_score = 1.0 if "All" in profile.get("season", []) or season.lower() in [s.lower() for s in profile.get("season", [])] else 0.65
        temp = weather.get("main", {}).get("temp", 26.0)
        weather_score = 1.0 if 20 <= temp <= 32 else 0.7
        budget_score = 1.0 if not budget or total_investment <= budget else 0.5

        agronomy_score = (soil_score * 0.35 + season_score * 0.35 + weather_score * 0.30)
        profit_score = min(max(profit_per_ha / 120000.0, 0.1), 1.0)
        final_score = (agronomy_score * 0.35 + profit_score * 0.55 + budget_score * 0.10)

        # Dynamic Explanations
        reasons = [
            f"Expected yield of {yield_t_per_ha} tonnes/ha based on current {soil.get('soil_type', 'regional')} soil conditions",
            f"Estimated Net ROI of {roi_percent:.1f}% at Mandi benchmark ₹{price_per_kg:.1f}/kg",
            f"Break-even safety price: ₹{break_even_per_kg:.1f}/kg (₹{break_even_per_quintal:.0f}/Quintal)"
        ]

        return {
            "crop": canonical_name,
            "category": category,
            "profitability": profitability,
            "revenue": round(revenue, 2),
            "investment": round(total_investment, 2),
            "profit": round(profit, 2),
            "profit_per_ha": round(profit_per_ha, 2),
            "yield_t_per_ha": yield_t_per_ha,
            "duration_days": profile.get("duration_days", (90, 120)),
            "price_per_kg": round(price_per_kg, 2),
            "price_per_quintal": round(price_per_quintal, 2),
            "break_even_price_per_kg": round(break_even_per_kg, 2),
            "break_even_price_per_quintal": round(break_even_per_quintal, 2),
            "roi_percent": round(roi_percent, 1),
            "bc_ratio": round(bc_ratio, 2),
            "cost_breakdown": cost_breakdown,
            "scenarios": scenarios,
            "suitability_score": round(agronomy_score, 2),
            "profit_score": round(profit_score, 2),
            "soil_match": round(soil_score, 2),
            "season_match": round(season_score, 2),
            "final_score": round(final_score, 3),
            "explanation": reasons,
            "risk": profile.get("pest_risk", "Medium"),
            "water_requirement": profile.get("water_needs", "Medium")
        }


    def _get_crop_info(self, crop_name: str) -> Dict[str, Any]:
        """Lookup crop info from agronomic database or return sensible defaults"""
        if not crop_name:
            return {
                "name": "Crop",
                "category": "General",
                "default_yield_t_per_ha": 5.0,
                "default_price_per_kg": 25.0,
                "default_investment": 50000.0,
                "cost_ratio": {"seeds": 0.20, "fertilizer": 0.25, "labor": 0.25, "machinery": 0.15, "irrigation": 0.15}
            }

        c_lower = crop_name.strip().lower()
        for k, v in self.crop_database.items():
            if k.lower() == c_lower or k.lower() in c_lower or c_lower in k.lower():
                seeds_cost = float(v.get("seed_rate_kg_ha", 1.0) * v.get("seed_price_per_kg", 50.0))
                fert_cost = float(v.get("npk_needs_kg", (100, 50, 50))[0] * 35.0)
                labor_cost = float(v.get("labor_mandays_ha", 50) * 400.0)
                mach_cost = float(v.get("machinery_hrs_ha", 15) * 800.0)
                irrig_cost = float(v.get("irrigation_hrs_ha", 100) * 60.0)
                tot = seeds_cost + fert_cost + labor_cost + mach_cost + irrig_cost
                if tot <= 0:
                    tot = 50000.0
                return {
                    "name": k,
                    "category": v.get("category", "General"),
                    "default_yield_t_per_ha": float(v.get("base_yield_t_per_ha", 5.0)),
                    "default_price_per_kg": float(v.get("benchmark_price_per_kg", 25.0)),
                    "default_investment": round(tot, 2),
                    "cost_ratio": {
                        "seeds": round(seeds_cost / tot, 2) if tot > 0 else 0.20,
                        "fertilizer": round(fert_cost / tot, 2) if tot > 0 else 0.25,
                        "labor": round(labor_cost / tot, 2) if tot > 0 else 0.25,
                        "machinery": round(mach_cost / tot, 2) if tot > 0 else 0.15,
                        "irrigation": round(irrig_cost / tot, 2) if tot > 0 else 0.15,
                    }
                }

        return {
            "name": crop_name.strip().title(),
            "category": "General",
            "default_yield_t_per_ha": 5.0,
            "default_price_per_kg": 25.0,
            "default_investment": 50000.0,
            "cost_ratio": {"seeds": 0.20, "fertilizer": 0.25, "labor": 0.25, "machinery": 0.15, "irrigation": 0.15}
        }


# Global instance
recommendation_engine = RecommendationEngine()

