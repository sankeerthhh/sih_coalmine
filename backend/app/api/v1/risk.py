from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.risk_assessment import RiskAssessment
from app.schemas.risk import RiskSummaryResponse, RiskAssessmentResponse
from app.ai.risk_scorer import RiskScorer

router = APIRouter(prefix="/risk", tags=["AI Risk Assessment"])

@router.get("/current", response_model=RiskSummaryResponse)
def get_current_risk(panel_id: str = Query("PANEL-B3"), db: Session = Depends(get_db)):
    latest = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.panel_id == panel_id)
        .order_by(RiskAssessment.timestamp.desc())
        .first()
    )

    if latest:
        score = latest.risk_score
        classification = latest.risk_classification
        factors = {
            "Tilt Increase": latest.tilt_factor,
            "Displacement Velocity": latest.displacement_factor,
            "Vibration RMS": latest.vibration_factor,
            "Neighbor Correlation": latest.spatial_correlation_factor
        }
        latest_resp = RiskAssessmentResponse.model_validate(latest)
    else:
        score = 14.5
        classification = "NORMAL"
        factors = {
            "Tilt Increase": 22.0,
            "Displacement Velocity": 38.0,
            "Vibration RMS": 20.0,
            "Neighbor Correlation": 20.0
        }
        latest_resp = None

    trend_direction = "INCREASING" if score > 50 else "STABLE"

    return RiskSummaryResponse(
        current_risk_score=score,
        risk_classification=classification,
        primary_panel=panel_id,
        affected_cluster="Cluster N12-N16" if score > 30 else "None (Quiescent)",
        factors=factors,
        trend_direction=trend_direction,
        scientific_disclaimer=RiskScorer.DISCLAIMER,
        latest_assessment=latest_resp
    )

@router.get("/history", response_model=List[RiskAssessmentResponse])
def get_risk_history(
    panel_id: str = Query("PANEL-B3"),
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    records = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.panel_id == panel_id, RiskAssessment.timestamp >= since)
        .order_by(RiskAssessment.timestamp.asc())
        .all()
    )
    return records
