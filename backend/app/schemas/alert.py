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


class TestBroadcastRequest(BaseModel):
    panel_id: str = "PANEL-B3"
    sms_target_name: Optional[str] = None
    sms_target_phone: Optional[str] = None
    email_recipient_name: Optional[str] = None
    email_recipient_address: Optional[str] = None
    siren_location: Optional[str] = None
    siren_relay_channel: Optional[str] = None
    custom_message: Optional[str] = None


class ChannelDeliveryResult(BaseModel):
    status: str  # "SENT" | "SIMULATED" | "FAILED"
    provider: str
    recipient: str
    receipt: Optional[str] = None
    error: Optional[str] = None
    details: Optional[str] = None
    timestamp: str


class NotificationProviderStatus(BaseModel):
    email_configured: bool
    email_provider: str
    sms_configured: bool
    sms_provider: str
    setup_notes: str
