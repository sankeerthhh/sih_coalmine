from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True) # e.g. "ALT-2026-0042"
    panel_id = Column(String, ForeignKey("panels.id"), nullable=False, index=True)
    node_cluster = Column(String, nullable=False) # e.g. "Cluster N12-N16"
    title = Column(String, nullable=False)
    condition_detected = Column(String, nullable=False)
    severity = Column(String, nullable=False, index=True) # WARNING, HIGH, CRITICAL
    status = Column(String, default="ACTIVE", index=True) # ACTIVE, ACKNOWLEDGED, RESOLVED
    ai_risk_score = Column(Float, nullable=False)
    measured_tilt = Column(Float, default=0.0)
    measured_displacement = Column(Float, default=0.0)
    crack_detected = Column(Boolean, default=False)
    recommended_action = Column(Text, default="Immediate field inspection recommended.")
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    panel = relationship("Panel", back_populates="alerts")

Index("idx_alert_status_severity", Alert.status, Alert.severity)
