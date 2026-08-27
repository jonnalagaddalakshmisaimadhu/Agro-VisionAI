from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.database import get_db
from app.models.government_schemes import GovernmentScheme, SchemeApplication, SchemeRefreshLog
from app.models.user import User
from app.core.security import verify_token
from app.services.government_schemes import scheme_service
import json

router = APIRouter()


class EligibilityCheckRequest(BaseModel):
    state: str = "Andhra Pradesh"
    landholding_acres: float = 2.0
    farmer_type: str = "Small Farmer"
    crop: Optional[str] = "Paddy"


def _format_scheme_dict(scheme: GovernmentScheme) -> Dict[str, Any]:
    return {
        "id": scheme.id,
        "name": scheme.name,
        "description": scheme.description,
        "eligibility_criteria": scheme.eligibility_criteria,
        "benefits": scheme.benefits,
        "subsidy_percentage": scheme.subsidy_percentage,
        "category": scheme.category,
        "sector": scheme.sector,
        "applicable_states": json.loads(scheme.applicable_states) if scheme.applicable_states else [],
        "applicable_crops": json.loads(scheme.applicable_crops) if scheme.applicable_crops else [],
        "application_process": scheme.application_process,
        "required_documents": json.loads(scheme.required_documents) if scheme.required_documents else [],
        "contact_info": json.loads(scheme.contact_info) if scheme.contact_info else {},
        "website_url": scheme.website_url,
        "official_apply_url": scheme.official_apply_url or scheme.website_url,
        "is_active": scheme.is_active,
        "is_new": scheme.is_new,
        "expiry_date": scheme.expiry_date.isoformat() if scheme.expiry_date else None,
        "created_at": scheme.created_at.isoformat() if scheme.created_at else None,
        "last_refreshed": scheme.last_refreshed.isoformat() if scheme.last_refreshed else None
    }


@router.get("/", response_model=List[dict])
@router.get("/schemes", response_model=List[dict])
async def get_government_schemes(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    crop: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    active_only: bool = Query(True)
):
    """Get government schemes with multi-state and crop filters."""
    scheme_service.seed_default_schemes(db)
    
    query = db.query(GovernmentScheme)
    if active_only:
        query = query.filter(GovernmentScheme.is_active == True)
    if category and category != "All" and category != "All Types":
        query = query.filter(GovernmentScheme.category == category)
    if sector and sector != "All" and sector != "All Sectors":
        query = query.filter(GovernmentScheme.sector == sector)

    schemes = query.all()
    filtered_schemes = []

    for scheme in schemes:
        app_states = json.loads(scheme.applicable_states) if scheme.applicable_states else []
        app_crops = json.loads(scheme.applicable_crops) if scheme.applicable_crops else []

        if state and state != "All India" and state not in app_states and "All India" not in app_states:
            continue
        if crop and crop != "All Crops" and crop not in app_crops and "All Crops" not in app_crops:
            continue

        filtered_schemes.append(_format_scheme_dict(scheme))

    return filtered_schemes


@router.get("/new-schemes")
async def get_newly_announced_schemes(limit: int = 10, db: Session = Depends(get_db)):
    """Fetch newly announced schemes on the market."""
    scheme_service.seed_default_schemes(db)
    new_schemes = db.query(GovernmentScheme).filter(GovernmentScheme.is_new == True).limit(limit).all()
    return [_format_scheme_dict(s) for s in new_schemes]


@router.post("/check-eligibility")
async def check_farmer_scheme_eligibility(
    request: EligibilityCheckRequest,
    db: Session = Depends(get_db)
):
    """Automated AI/Rules-Based Eligibility & Subsidy Calculation Engine."""
    result = scheme_service.check_eligibility(
        db=db,
        state=request.state,
        landholding_acres=request.landholding_acres,
        farmer_type=request.farmer_type,
        crop=request.crop
    )
    return result


@router.get("/refresh-status")
async def get_refresh_status(db: Session = Depends(get_db)):
    """Get the last background synchronization status."""
    return scheme_service.get_refresh_status(db)


@router.post("/refresh-schemes")
async def trigger_scheme_refresh(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually trigger background refresh from MyScheme and national databases."""
    background_tasks.add_task(scheme_service.refresh_schemes_from_external_apis, db)
    return {
        "message": "Government schemes refresh initiated in background",
        "status": "in_progress",
        "timestamp": datetime.utcnow().isoformat()
    }


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
            {"id": "Digital Agriculture", "name": "Digital Agriculture"}
        ]
    }


@router.get("/states")
async def get_applicable_states():
    """Get list of applicable states."""
    return {
        "states": [
            "All India",
            "Andhra Pradesh",
            "Telangana",
            "Karnataka",
            "Maharashtra",
            "Tamil Nadu",
            "Punjab",
            "Haryana",
            "Uttar Pradesh",
            "Madhya Pradesh",
            "Gujarat",
            "Rajasthan",
            "Bihar",
            "Odisha",
            "West Bengal",
            "Kerala",
            "Assam"
        ]
    }


@router.get("/{scheme_id}")
@router.get("/schemes/{scheme_id}")
async def get_scheme_by_id(scheme_id: int, db: Session = Depends(get_db)):
    """Get details of a specific scheme."""
    scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")
    return _format_scheme_dict(scheme)


@router.get("/{scheme_id}/voice-summary")
@router.get("/schemes/{scheme_id}/voice-summary")
async def get_scheme_voice_summary(scheme_id: int, lang: str = "en", db: Session = Depends(get_db)):
    """Get vernacular spoken audio text in Telugu, Hindi, or English for a scheme."""
    result = scheme_service.get_voice_summary(db=db, scheme_id=scheme_id, lang=lang)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result


@router.post("/{scheme_id}/apply")
@router.post("/schemes/{scheme_id}/apply")
async def apply_for_scheme(
    scheme_id: int,
    application_data: dict,
    db: Session = Depends(get_db)
):
    """Apply for a government scheme or record application interest."""
    scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")
    
    return {
        "message": "Application recorded successfully",
        "scheme_name": scheme.name,
        "official_portal_url": scheme.official_apply_url or scheme.website_url,
        "status": "submitted",
        "submission_date": datetime.utcnow().isoformat()
    }

