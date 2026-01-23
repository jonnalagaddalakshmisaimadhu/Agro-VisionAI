from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.marketplace import Product
from app.models.user import User
from app.schemas.marketplace import ProductCreate, ProductResponse, ProductUpdate
from app.core.security import verify_token

router = APIRouter()

@router.get("/products", response_model=List[ProductResponse])
async def get_farm_market_products(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    organic_only: bool = Query(False),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    limit: int = Query(20),
    offset: int = Query(0)
):
    """Get farm market products (seeds, fertilizers, pest control) with filters."""
    query = db.query(Product).filter(Product.stock_quantity > 0)
    
    # Filter by category (seeds, fertilizer, pest-control)
    if category:
        query = query.filter(Product.category == category)
    
    # Search in name and description
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.description.ilike(f"%{search}%"))
        )
    
    # Organic filter
    if organic_only:
        query = query.filter(Product.is_organic == True)
    
    # Price range filter
    if min_price is not None:
        query = query.filter(Product.price_per_unit >= min_price)
    if max_price is not None:
        query = query.filter(Product.price_per_unit <= max_price)
    
    products = query.offset(offset).limit(limit).all()
    return products

@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_farm_market_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific farm market product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.get("/categories")
async def get_farm_market_categories():
    """Get farm market product categories."""
    return {
        "categories": [
            {
                "id": "seeds",
                "name": "Seeds",
                "description": "High-quality seeds for various crops",
                "icon": "🌱"
            },
            {
                "id": "fertilizer",
                "name": "Fertilizers",
                "description": "Organic and chemical fertilizers",
                "icon": "🌿"
            },
            {
                "id": "pest-control",
                "name": "Pest Control",
                "description": "Pesticides and pest control solutions",
                "icon": "🐛"
            }
        ]
    }

@router.get("/featured-products", response_model=List[ProductResponse])
async def get_featured_products(db: Session = Depends(get_db), limit: int = 8):
    """Get featured farm market products."""
    # Get products with high ratings and good stock
    products = db.query(Product).filter(
        Product.stock_quantity > 0,
        Product.rating >= 4.0
    ).order_by(Product.rating.desc()).limit(limit).all()
    
    return products

@router.get("/trending-products", response_model=List[ProductResponse])
async def get_trending_products(db: Session = Depends(get_db), limit: int = 6):
    """Get trending farm market products."""
    # Get recently added products with good ratings
    products = db.query(Product).filter(
        Product.stock_quantity > 0,
        Product.rating >= 3.5
    ).order_by(Product.created_at.desc()).limit(limit).all()
    
    return products

@router.get("/organic-products", response_model=List[ProductResponse])
async def get_organic_products(db: Session = Depends(get_db), limit: int = 10):
    """Get organic farm market products."""
    products = db.query(Product).filter(
        Product.is_organic == True,
        Product.stock_quantity > 0
    ).order_by(Product.rating.desc()).limit(limit).all()
    
    return products

@router.get("/low-stock-products", response_model=List[ProductResponse])
async def get_low_stock_products(db: Session = Depends(get_db), limit: int = 10):
    """Get products with low stock (for inventory management)."""
    products = db.query(Product).filter(
        Product.stock_quantity <= 10,
        Product.stock_quantity > 0
    ).order_by(Product.stock_quantity.asc()).limit(limit).all()
    
    return products

@router.get("/price-ranges")
async def get_price_ranges(db: Session = Depends(get_db)):
    """Get price ranges for different product categories."""
    categories = ["seeds", "fertilizer", "pest-control"]
    price_ranges = {}
    
    for category in categories:
        products = db.query(Product).filter(Product.category == category).all()
        if products:
            prices = [p.price_per_unit for p in products]
            price_ranges[category] = {
                "min": min(prices),
                "max": max(prices),
                "avg": sum(prices) / len(prices)
            }
    
    return price_ranges

@router.get("/seller-stats")
async def get_seller_statistics(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get seller statistics for current user."""
    products = db.query(Product).filter(Product.seller_id == current_user.id).all()
    
    if not products:
        return {
            "total_products": 0,
            "total_sales": 0,
            "average_rating": 0,
            "categories": []
        }
    
    total_products = len(products)
    total_sales = sum(p.total_reviews for p in products)  # Assuming reviews = sales
    average_rating = sum(p.rating for p in products) / total_products if total_products > 0 else 0
    
    categories = list(set(p.category for p in products))
    
    return {
        "total_products": total_products,
        "total_sales": total_sales,
        "average_rating": round(average_rating, 2),
        "categories": categories
    }
