from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    panel_id: str
    node_cluster: str
    title: str
    condition_detected: str
    severity: str
    status: str
    ai_risk_score: float
    measured_tilt: float
    measured_displacement: float
    crack_detected: bool
    recommended_action: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str = "Mine Safety Officer"
    notes: Optional[str] = None


class AlertResolveRequest(BaseModel):
    resolved_by: str = "Mine Safety Officer"
    notes: Optional[str] = None
