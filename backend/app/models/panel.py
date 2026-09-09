from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Panel(Base):
    __tablename__ = "panels"

    id = Column(String, primary_key=True, index=True)  # e.g., "PANEL-B3"
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False)
    name = Column(String, nullable=False)
    extraction_status = Column(String, default="ACTIVE")  # ACTIVE, DEPILLARING, INACTIVE, PLANNED
    depth_meters = Column(Float, default=180.0)
    boundary_geojson = Column(Text, nullable=True)
    risk_level = Column(String, default="NORMAL")  # NORMAL, WARNING, HIGH, CRITICAL
    created_at = Column(DateTime, default=datetime.utcnow)

    mine = relationship("Mine", back_populates="panels")
    sensors = relationship("SensorNode", back_populates="panel", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="panel", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="panel", cascade="all, delete-orphan")
