from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.models.marketplace import Product, Equipment
from app.models.user import User
from app.schemas.marketplace import ProductCreate, ProductResponse, ProductUpdate
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

DEFAULT_PRODUCTS = [
    {
        "name": "Fresh Hybrid Tomatoes",
        "category": "vegetables",
        "price_per_unit": 35.0,
        "unit": "kg",
        "stock_quantity": 800.0,
        "seller_name": "Ramesh Patel",
        "phone_number": "9848022338",
        "location": "Kolar, Karnataka",
        "is_organic": True,
        "is_verified": True,
        "rating": 4.9,
        "total_reviews": 24,
        "harvest_date": "2026-08-25",
        "image_url": "🍅",
        "description": "Naturally ripened, firm hybrid tomatoes ideal for wholesale or local markets."
    },
    {
        "name": "Guntur Teja Red Chilli",
        "category": "spices",
        "price_per_unit": 220.0,
        "unit": "kg",
        "stock_quantity": 1500.0,
        "seller_name": "Siva Krishna",
        "phone_number": "9440156789",
        "location": "Guntur, Andhra Pradesh",
        "is_organic": False,
        "is_verified": True,
        "rating": 5.0,
        "total_reviews": 42,
        "harvest_date": "2026-08-20",
        "image_url": "🌶️",
        "description": "High pungency, sun-dried Guntur Teja red chillies directly from the Guntur mirchi yard."
    },
    {
        "name": "Premium Sharbati Wheat",
        "category": "grains",
        "price_per_unit": 38.0,
        "unit": "kg",
        "stock_quantity": 5000.0,
        "seller_name": "Gurdeep Singh",
        "phone_number": "9814088991",
        "location": "Sehore, Madhya Pradesh",
        "is_organic": True,
        "is_verified": True,
        "rating": 4.8,
        "total_reviews": 19,
        "harvest_date": "2026-08-15",
        "image_url": "🌾",
        "description": "Golden grain, high gluten Sharbati wheat grown in black cotton soil without chemical pesticides."
    },
    {
        "name": "Nagpur Juicy Mandarins (Santra)",
        "category": "fruits",
        "price_per_unit": 65.0,
        "unit": "kg",
        "stock_quantity": 2500.0,
        "seller_name": "Anil Deshmukh",
        "phone_number": "9765012345",
        "location": "Nagpur, Maharashtra",
        "is_organic": False,
        "is_verified": True,
        "rating": 4.7,
        "total_reviews": 31,
        "harvest_date": "2026-08-26",
        "image_url": "🍊",
        "description": "Sweet and tangy grade-A Nagpur oranges harvested fresh from our Vidarbha orchard."
    },
    {
        "name": "Nashik Red Onions (Garwa Quality)",
        "category": "vegetables",
        "price_per_unit": 28.0,
        "unit": "kg",
        "stock_quantity": 4000.0,
        "seller_name": "Sunita Shinde",
        "phone_number": "9822045678",
        "location": "Lasalgaon, Nashik",
        "is_organic": False,
        "is_verified": True,
        "rating": 4.8,
        "total_reviews": 55,
        "harvest_date": "2026-08-22",
        "image_url": "🧅",
        "description": "Dry, cured Lasalgaon red onions with excellent shelf life for bulk storage."
    },
    {
        "name": "Traditional Dehradun Basmati Rice",
        "category": "grains",
        "price_per_unit": 95.0,
        "unit": "kg",
        "stock_quantity": 3000.0,
        "seller_name": "Vikram Negi",
        "phone_number": "9412078901",
        "location": "Dehradun, Uttarakhand",
        "is_organic": True,
        "is_verified": True,
        "rating": 4.9,
        "total_reviews": 38,
        "harvest_date": "2026-08-10",
        "image_url": "🍚",
        "description": "Extra-long grain aromatic 1121 Basmati rice, aged for 12 months for supreme fragrance."
    },
    {
        "name": "High-Curcumin Lakadong Turmeric",
        "category": "spices",
        "price_per_unit": 240.0,
        "unit": "kg",
        "stock_quantity": 600.0,
        "seller_name": "Wanbha Marwein",
        "phone_number": "9863098765",
        "location": "Jaintia Hills, Meghalaya",
        "is_organic": True,
        "is_verified": True,
        "rating": 5.0,
        "total_reviews": 60,
        "harvest_date": "2026-08-18",
        "image_url": "🌿",
        "description": "Certified organic turmeric powder with lab-verified 7.5% curcumin content."
    },
    {
        "name": "Fresh Buffalo Farm Milk & Desi Ghee",
        "category": "dairy",
        "price_per_unit": 70.0,
        "unit": "liter",
        "stock_quantity": 150.0,
        "seller_name": "Venkata Rao",
        "phone_number": "9849033445",
        "location": "Vijayawada, Andhra Pradesh",
        "is_organic": True,
        "is_verified": True,
        "rating": 4.9,
        "total_reviews": 29,
        "harvest_date": "2026-08-27",
        "image_url": "🥛",
        "description": "Pure A2 Murrah buffalo milk and Vedic bilona cow ghee, unpasteurized and non-diluted."
    }
]

def seed_default_products(db: Session):
    """Seed initial marketplace products if database table is empty."""
    try:
        count = db.query(Product).count()
        if count == 0:
            logger.info("Seeding Marketplace with verified farm produce...")
            for p in DEFAULT_PRODUCTS:
                db_prod = Product(
                    name=p["name"],
                    category=p["category"],
                    price_per_unit=p["price_per_unit"],
                    unit=p["unit"],
                    stock_quantity=p["stock_quantity"],
                    seller_name=p["seller_name"],
                    phone_number=p["phone_number"],
                    location=p["location"],
                    is_organic=p["is_organic"],
                    is_verified=p["is_verified"],
                    rating=p["rating"],
                    total_reviews=p["total_reviews"],
                    harvest_date=p["harvest_date"],
                    image_url=p["image_url"],
                    description=p["description"]
                )
                db.add(db_prod)
            db.commit()
            logger.info(f"Successfully seeded {len(DEFAULT_PRODUCTS)} marketplace products.")
    except Exception as e:
        logger.error(f"Error seeding marketplace products: {e}")
        db.rollback()


@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    organic_only: bool = Query(False),
    search: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0)
):
    """Get marketplace products with filtering and search."""
    seed_default_products(db)
    
    query = db.query(Product).filter(Product.stock_quantity > 0)
    
    if category and category.lower() != "all":
        query = query.filter(Product.category == category.lower())
    
    if location and location.lower() != "all":
        query = query.filter(Product.location.ilike(f"%{location}%"))
    
    if organic_only:
        query = query.filter(Product.is_organic == True)
        
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.description.ilike(f"%{search}%")) |
            (Product.location.ilike(f"%{search}%")) |
            (Product.seller_name.ilike(f"%{search}%"))
        )
    
    products = query.order_by(Product.id.desc()).offset(offset).limit(limit).all()
    return products


@router.post("/products", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new product listing (persisted in SQLite/PostgreSQL)."""
    db_product = Product(
        name=product.name,
        description=product.description,
        category=product.category.lower(),
        price_per_unit=product.price_per_unit,
        unit=product.unit or "kg",
        stock_quantity=product.stock_quantity,
        seller_name=product.seller_name or "Farmer",
        phone_number=product.phone_number or "9876543210",
        location=product.location or "India",
        is_organic=product.is_organic,
        is_verified=True,
        rating=5.0,
        total_reviews=1,
        harvest_date=product.harvest_date or datetime.utcnow().strftime("%Y-%m-%d"),
        image_url=product.image_url or "📦",
        video_url=product.video_url
    )
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    
    return db_product


@router.get("/suggested-price/{crop_name}")
async def get_suggested_mandi_price(crop_name: str, db: Session = Depends(get_db)):
    """Suggest fair selling benchmark price based on prevailing market rates."""
    crop_lower = crop_name.lower().strip()
    
    benchmark_rates = {
        "tomato": {"min": 25, "avg": 35, "max": 48, "unit": "kg", "mandi": "Kolar Mandi"},
        "tomatoes": {"min": 25, "avg": 35, "max": 48, "unit": "kg", "mandi": "Kolar Mandi"},
        "onion": {"min": 20, "avg": 28, "max": 38, "unit": "kg", "mandi": "Lasalgaon Mandi"},
        "onions": {"min": 20, "avg": 28, "max": 38, "unit": "kg", "mandi": "Lasalgaon Mandi"},
        "potato": {"min": 18, "avg": 24, "max": 30, "unit": "kg", "mandi": "Agra Mandi"},
        "chilli": {"min": 180, "avg": 220, "max": 260, "unit": "kg", "mandi": "Guntur Yard"},
        "rice": {"min": 40, "avg": 65, "max": 95, "unit": "kg", "mandi": "Karnal Mandi"},
        "paddy": {"min": 21, "avg": 23.5, "max": 28, "unit": "kg", "mandi": "Nizamabad Mandi"},
        "wheat": {"min": 28, "avg": 36, "max": 45, "unit": "kg", "mandi": "Sehore Mandi"},
        "cotton": {"min": 65, "avg": 75, "max": 88, "unit": "kg", "mandi": "Adilabad Mandi"},
        "turmeric": {"min": 140, "avg": 190, "max": 240, "unit": "kg", "mandi": "Nizamabad Yard"},
        "mango": {"min": 350, "avg": 450, "max": 650, "unit": "dozen", "mandi": "Ratnagiri Market"}
    }
    
    for key, data in benchmark_rates.items():
        if key in crop_lower:
            return {
                "crop": crop_name,
                "suggested_price": data["avg"],
                "min_price": data["min"],
                "max_price": data["max"],
                "unit": data["unit"],
                "reference_mandi": data["mandi"],
                "recommendation": f"Selling between ₹{data['min']} and ₹{data['max']} per {data['unit']} guarantees quick wholesale buyer inquiries."
            }
            
    # Default estimate
    return {
        "crop": crop_name,
        "suggested_price": 40.0,
        "min_price": 30.0,
        "max_price": 55.0,
        "unit": "kg",
        "reference_mandi": "National Agri Index",
        "recommendation": "Recommended listing between ₹30 and ₹55 per kg for standard grade produce."
    }


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product


@router.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product listing."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully", "id": product_id}
