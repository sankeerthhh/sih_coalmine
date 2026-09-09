from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    panel_id = Column(String, ForeignKey("panels.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    risk_score = Column(Float, nullable=False) # 0 to 100
    risk_classification = Column(String, nullable=False) # NORMAL, WARNING, HIGH, CRITICAL
    primary_contributing_node_id = Column(String, nullable=True)
    tilt_factor = Column(Float, default=0.0) # contribution percentage
    displacement_factor = Column(Float, default=0.0)
    vibration_factor = Column(Float, default=0.0)
    spatial_correlation_factor = Column(Float, default=0.0)
    explanation = Column(Text, nullable=True)

    panel = relationship("Panel", back_populates="risk_assessments")

Index("idx_panel_risk_timestamp", RiskAssessment.panel_id, RiskAssessment.timestamp)
