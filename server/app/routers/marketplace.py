from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.marketplace import Product
from app.models.user import User
from app.schemas.marketplace import ProductCreate, ProductResponse, ProductUpdate
from app.core.security import verify_token

router = APIRouter()

@router.post("/products", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a new product listing."""
    db_product = Product(
        **product.dict(),
        seller_id=current_user.id
    )
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    return db_product

@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    organic_only: bool = Query(False),
    limit: int = Query(20),
    offset: int = Query(0)
):
    """Get products with optional filters."""
    query = db.query(Product).filter(Product.stock_quantity > 0)
    
    if category:
        query = query.filter(Product.category == category)
    
    if location:
        query = query.filter(Product.location.ilike(f"%{location}%"))
    
    if organic_only:
        query = query.filter(Product.is_organic == True)
    
    products = query.offset(offset).limit(limit).all()
    return products

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

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update a product (only by owner)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this product"
        )
    
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return product

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Delete a product (only by owner)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this product"
        )
    
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}

@router.get("/my-products", response_model=List[ProductResponse])
async def get_my_products(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get current user's products."""
    products = db.query(Product).filter(Product.seller_id == current_user.id).all()
    return products

@router.get("/categories")
async def get_product_categories():
    """Get available product categories."""
    return {
        "categories": [
            {"id": "vegetables", "name": "Vegetables"},
            {"id": "grains", "name": "Grains"},
            {"id": "fruits", "name": "Fruits"},
            {"id": "dairy", "name": "Dairy"},
            {"id": "seeds", "name": "Seeds"},
            {"id": "fertilizer", "name": "Fertilizers"},
            {"id": "pest-control", "name": "Pest Control"}
        ]
    }
