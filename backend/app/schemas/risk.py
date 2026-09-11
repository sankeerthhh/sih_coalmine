from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class RiskAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    panel_id: str
    timestamp: datetime
    risk_score: float
    risk_classification: str
    primary_contributing_node_id: Optional[str] = None
    tilt_factor: float
    displacement_factor: float
    vibration_factor: float
    spatial_correlation_factor: float
    explanation: Optional[str] = None


class RiskSummaryResponse(BaseModel):
    current_risk_score: float
    risk_classification: str
    primary_panel: str
    affected_cluster: str
    factors: Dict[str, float]
    trend_direction: str  # STABLE, INCREASING, DECREASING
    scientific_disclaimer: str
    latest_assessment: Optional[RiskAssessmentResponse] = None
    explanation: Optional[str] = None
    geotechnical_score: Optional[float] = None
    ml_severity_score: Optional[float] = None
    fusion_weights: Optional[Dict[str, float]] = None
    ml_prediction: Optional[Dict[str, Any]] = None
    fingerprint: Optional[Dict[str, Any]] = None
    early_warning: Optional[Dict[str, Any]] = None

