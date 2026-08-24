from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models.government_schemes import GovernmentScheme, SchemeApplication, SchemeRefreshLog
from app.models.user import User
from app.core.security import verify_token
from app.services.government_schemes import scheme_service
import json

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_government_schemes(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    crop: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    active_only: bool = Query(True)
):
    """Get government schemes with optional filters."""
    query = db.query(GovernmentScheme)
    
    if active_only:
        query = query.filter(GovernmentScheme.is_active == True)
    
    if category:
        query = query.filter(GovernmentScheme.category == category)
    
    if sector:
        query = query.filter(GovernmentScheme.sector == sector)
    
    schemes = query.all()
    
    # Filter by state and crop if provided
    filtered_schemes = []
    for scheme in schemes:
        # Parse applicable states and crops
        applicable_states = json.loads(scheme.applicable_states) if scheme.applicable_states else []
        applicable_crops = json.loads(scheme.applicable_crops) if scheme.applicable_crops else []
        
        # Check state filter
        if state and state not in applicable_states and "All India" not in applicable_states:
            continue
        
        # Check crop filter
        if crop and crop not in applicable_crops and "All Crops" not in applicable_crops:
            continue
        
        # Convert to dict and add parsed fields
        scheme_dict = {
            "id": scheme.id,
            "name": scheme.name,
            "description": scheme.description,
            "eligibility_criteria": scheme.eligibility_criteria,
            "benefits": scheme.benefits,
            "subsidy_percentage": scheme.subsidy_percentage,
            "category": scheme.category,
            "sector": scheme.sector,
            "applicable_states": applicable_states,
            "applicable_crops": applicable_crops,
            "application_process": scheme.application_process,
            "required_documents": json.loads(scheme.required_documents) if scheme.required_documents else [],
            "contact_info": json.loads(scheme.contact_info) if scheme.contact_info else {},
            "website_url": scheme.website_url,
            "official_apply_url": scheme.official_apply_url,
            "is_active": scheme.is_active,
            "is_new": scheme.is_new,
            "expiry_date": scheme.expiry_date,
            "created_at": scheme.created_at,
            "last_refreshed": scheme.last_refreshed
        }
        filtered_schemes.append(scheme_dict)
    
    return filtered_schemes

@router.get("/schemes/{scheme_id}", response_model=dict)
async def get_scheme_by_id(scheme_id: int, db: Session = Depends(get_db)):
    """Get a specific government scheme by ID."""
    scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found"
        )
    
    return {
        "id": scheme.id,
        "name": scheme.name,
        "description": scheme.description,
        "eligibility_criteria": scheme.eligibility_criteria,
        "benefits": scheme.benefits,
        "subsidy_percentage": scheme.subsidy_percentage,
        "subsidy_percentage": scheme.subsidy_percentage,
        "category": scheme.category,
        "sector": scheme.sector,
        "applicable_states": json.loads(scheme.applicable_states) if scheme.applicable_states else [],
        "applicable_crops": json.loads(scheme.applicable_crops) if scheme.applicable_crops else [],
        "application_process": scheme.application_process,
        "required_documents": json.loads(scheme.required_documents) if scheme.required_documents else [],
        "contact_info": json.loads(scheme.contact_info) if scheme.contact_info else {},
        "website_url": scheme.website_url,
        "is_active": scheme.is_active,
        "expiry_date": scheme.expiry_date,
        "created_at": scheme.created_at
    }

@router.post("/schemes/{scheme_id}/apply")
async def apply_for_scheme(
    scheme_id: int,
    application_data: dict,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Apply for a government scheme."""
    # Check if scheme exists
    scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found"
        )
    
    if not scheme.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scheme is not active"
        )
    
    # Check if user already applied
    existing_application = db.query(SchemeApplication).filter(
        SchemeApplication.user_id == current_user.id,
        SchemeApplication.scheme_id == scheme_id
    ).first()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this scheme"
        )
    
    # Create new application
    application = SchemeApplication(
        user_id=current_user.id,
        scheme_id=scheme_id,
        application_data=json.dumps(application_data)
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return {
        "message": "Application submitted successfully",
        "application_id": application.id,
        "status": application.status
    }

@router.get("/my-applications", response_model=List[dict])
async def get_my_applications(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get current user's scheme applications."""
    applications = db.query(SchemeApplication).filter(
        SchemeApplication.user_id == current_user.id
    ).order_by(SchemeApplication.application_date.desc()).all()
    
    result = []
    for app in applications:
        scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == app.scheme_id).first()
        result.append({
            "id": app.id,
            "scheme_name": scheme.name if scheme else "Unknown Scheme",
            "scheme_id": app.scheme_id,
            "status": app.status,
            "application_date": app.application_date,
            "review_date": app.review_date,
            "comments": app.comments,
            "application_data": json.loads(app.application_data) if app.application_data else {}
        })
    
    return result

@router.get("/categories")
async def get_scheme_categories():
    """Get available scheme categories."""
    return {
        "categories": [
            {"id": "Direct Benefit Transfer", "name": "Direct Benefit Transfer"},
            {"id": "Insurance", "name": "Insurance"},
            {"id": "Credit/Loan", "name": "Credit/Loan"},
            {"id": "Equipment", "name": "Equipment"},
            {"id": "Soil Management", "name": "Soil Management"},
            {"id": "Sustainable Agriculture", "name": "Sustainable Agriculture"},
            {"id": "Training", "name": "Training"},
            {"id": "Research", "name": "Research"}
        ]
    }

@router.get("/states")
async def get_applicable_states():
    """Get list of applicable states."""
    return {
        "states": [
            "All India",
            "Andhra Pradesh",
            "Arunachal Pradesh",
            "Assam",
            "Bihar",
            "Chhattisgarh",
            "Goa",
            "Gujarat",
            "Haryana",
            "Himachal Pradesh",
            "Jharkhand",
            "Karnataka",
            "Kerala",
            "Madhya Pradesh",
            "Maharashtra",
            "Manipur",
            "Meghalaya",
            "Mizoram",
            "Nagaland",
            "Odisha",
            "Punjab",
            "Rajasthan",
            "Sikkim",
            "Tamil Nadu",
            "Telangana",
            "Tripura",
            "Uttar Pradesh",
            "Uttarakhand",
            "West Bengal"
        ]
    }

@router.post("/refresh-schemes")
async def refresh_schemes(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token)
):
    """Manually trigger scheme refresh from external APIs"""
    try:
        # Run refresh in background
        background_tasks.add_task(scheme_service.refresh_schemes_from_external_apis, db)
        
        return {
            "message": "Scheme refresh initiated successfully",
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate refresh: {str(e)}"
        )

@router.get("/refresh-status")
async def get_refresh_status(db: Session = Depends(get_db)):
    """Get the current refresh status and next refresh time"""
    try:
        status_info = scheme_service.get_refresh_status(db)
        return status_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get refresh status: {str(e)}"
        )

@router.post("/mark-new-schemes-seen")
async def mark_new_schemes_seen(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token)
):
    """Mark all new schemes as seen by the user"""
    try:
        scheme_service.mark_new_schemes_as_old(db)
        return {"message": "New schemes marked as seen"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark schemes as seen: {str(e)}"
        )

@router.get("/new-schemes")
async def get_new_schemes(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50)
):
    """Get recently added schemes"""
    try:
        schemes = db.query(GovernmentScheme).filter(
            GovernmentScheme.is_new == True,
            GovernmentScheme.is_active == True
        ).order_by(GovernmentScheme.created_at.desc()).limit(limit).all()
        
        result = []
        for scheme in schemes:
            result.append({
                "id": scheme.id,
                "name": scheme.name,
                "description": scheme.description,
                "category": scheme.category,
                "benefits": scheme.benefits,
                "subsidy_percentage": scheme.subsidy_percentage,
                "official_apply_url": scheme.official_apply_url,
                "created_at": scheme.created_at
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get new schemes: {str(e)}"
        )
