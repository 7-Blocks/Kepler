from fastapi import APIRouter, Depends, Query, Body
from database.session import get_db, MongoSession
from models.db_models import CollisionPrediction
from schemas.api_schemas import APIResponse, PaginationSchema
from app.core.exceptions import NotFoundError, ValidationError
from orbital.collision_engine import collision_engine
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger("app")
router = APIRouter()

VALID_STATUSES = ("PENDING", "MITIGATED", "ASSESSED", "IGNORED")
VALID_RISK_LEVELS = ("LOW", "MEDIUM", "HIGH", "CRITICAL")


def _serialize_collision(r: CollisionPrediction) -> Dict[str, Any]:
    """Serialize a real CollisionPrediction DB row to a clean dict."""
    obj_a = r.object_a
    obj_b = r.object_b
    return {
        "id":                   r.id,
        "object_a": {
            "id":               obj_a.id if obj_a else None,
            "name":             obj_a.name if obj_a else "UNKNOWN",
            "catalog_number":   obj_a.catalog_number if obj_a else "—",
            "classification":   obj_a.classification if obj_a else "UNKNOWN",
        } if obj_a else None,
        "object_b": {
            "id":               obj_b.id if obj_b else None,
            "name":             obj_b.name if obj_b else "UNKNOWN",
            "catalog_number":   obj_b.catalog_number if obj_b else "—",
            "classification":   obj_b.classification if obj_b else "UNKNOWN",
        } if obj_b else None,
        "probability":           r.probability,
        "tca":                   r.tca.isoformat() if r.tca else None,
        "miss_distance_m":       r.miss_distance_m,
        "relative_velocity_kms": r.relative_velocity_kms,
        "risk_level":            r.risk_level,
        "status":                r.status,
        "created_at":            r.created_at.isoformat() if r.created_at else None,
    }


@router.get("", response_model=APIResponse[List[Dict[str, Any]]])
def get_collisions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = Query(None, description="LOW | MEDIUM | HIGH | CRITICAL"),
    status: Optional[str] = Query(None, description="PENDING | MITIGATED | ASSESSED | IGNORED"),
    db: MongoSession = Depends(get_db),
):
    """
    Return real collision predictions from the database.
    Returns an empty list with a clear message if no conjunctions exist.
    NO mock data is returned.
    """
    # Reject unknown filter values outright. Passing them through would return an empty
    # page reading "Catalog is clear", which is indistinguishable from a genuine result.
    if risk_level and risk_level.upper() not in VALID_RISK_LEVELS:
        raise ValidationError(
            f"'{risk_level}' is not a valid risk level.",
            details={"field": "risk_level", "value": risk_level, "allowed": list(VALID_RISK_LEVELS)},
        )
    if status and status.upper() not in VALID_STATUSES:
        raise ValidationError(
            f"'{status}' is not a valid collision status.",
            details={"field": "status", "value": status, "allowed": list(VALID_STATUSES)},
        )

    query = (
        db.query(CollisionPrediction)
        .order_by(("probability", -1))
    )

    if risk_level:
        query = query.filter(CollisionPrediction.risk_level == risk_level.upper())
    if status:
        query = query.filter(CollisionPrediction.status == status.upper())

    total  = query.count()
    offset = (page - 1) * size
    records = query.offset(offset).limit(size).all()
    pages  = (total + size - 1) // size if total > 0 else 1

    data = [_serialize_collision(r) for r in records]

    msg = (
        f"{total} conjunction threat(s) detected in catalog"
        if total > 0
        else "No active conjunction risks detected. Catalog is clear."
    )

    return APIResponse(
        success=True,
        message=msg,
        data=data,
        pagination=PaginationSchema(page=page, size=size, total=total, pages=pages),
    )


@router.get("/{prediction_id}", response_model=APIResponse[Dict[str, Any]])
def get_collision_detail(prediction_id: int, db: MongoSession = Depends(get_db)):
    """Get a single collision prediction by ID."""
    pred = (
        db.query(CollisionPrediction)
        .filter(CollisionPrediction.id == prediction_id)
        .first()
    )
    if not pred:
        raise NotFoundError(resource="Collision prediction", identifier=prediction_id)

    detail = _serialize_collision(pred)
    detail["risk_scores"] = [
        {"ai_score": s.ai_score, "confidence": s.confidence, "severity": s.severity_classification}
        for s in (pred.risk_scores or [])
    ]
    return APIResponse(success=True, message="Collision detail retrieved", data=detail)


@router.patch("/{prediction_id}/status", response_model=APIResponse[Dict[str, Any]])
def update_collision_status(
    prediction_id: int,
    status: str = Body(..., embed=True),
    db: MongoSession = Depends(get_db),
):
    """Update the status of a collision prediction (PENDING → MITIGATED | ASSESSED | IGNORED)."""
    if status.upper() not in VALID_STATUSES:
        raise ValidationError(
            f"'{status}' is not a valid collision status.",
            details={"field": "status", "value": status, "allowed": list(VALID_STATUSES)},
        )

    pred = db.query(CollisionPrediction).filter(CollisionPrediction.id == prediction_id).first()
    if not pred:
        raise NotFoundError(resource="Collision prediction", identifier=prediction_id)

    pred.status = status.upper()
    db.commit()
    db.refresh(pred)
    return APIResponse(
        success=True,
        message=f"Collision {prediction_id} status updated to {status.upper()}",
        data=_serialize_collision(pred),
    )


@router.post("/evaluate", response_model=APIResponse[List[Dict[str, Any]]])
def trigger_collision_evaluation(db: MongoSession = Depends(get_db)):
    """Manually trigger a collision sweep over all tracked TLE objects."""
    results = collision_engine.predict_collisions(db)
    data = []
    for r in results:
        data.append({
            "id":          r.id,
            "probability": r.probability,
            "risk_level":  r.risk_level,
            "tca":         r.tca.isoformat(),
        })
    return APIResponse(
        success=True,
        message=f"Orbital conjunction scan complete — {len(data)} threat(s) detected.",
        data=data,
    )


@router.get("/{prediction_id}/explanation", response_model=APIResponse[str])
def get_conjunction_explanation(prediction_id: int, db: MongoSession = Depends(get_db)):
    """Generate an AI explanation for a real collision prediction."""
    from ai.openai_service import openai_service

    pred = (
        db.query(CollisionPrediction)
        .filter(CollisionPrediction.id == prediction_id)
        .first()
    )
    if not pred:
        raise NotFoundError(resource="Collision prediction", identifier=prediction_id)

    summary = openai_service.explain_collision({
        "obj_a": pred.object_a.name if pred.object_a else "UNKNOWN",
        "obj_b": pred.object_b.name if pred.object_b else "UNKNOWN",
        "prob":  f"{pred.probability * 100:.2f}%",
        "miss":  pred.miss_distance_m,
        "speed": pred.relative_velocity_kms,
    })
    return APIResponse(success=True, message="AI explanation generated", data=summary)
