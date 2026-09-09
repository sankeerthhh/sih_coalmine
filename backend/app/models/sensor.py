from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class SensorNode(Base):
    __tablename__ = "sensor_nodes"

    id = Column(String, primary_key=True, index=True)  # e.g., "N01", "N14"
    panel_id = Column(String, ForeignKey("panels.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    hardware_model = Column(String, default="LoRa-SX1262-Subsidence-V2")
    mesh_parent_id = Column(String, ForeignKey("sensor_nodes.id"), nullable=True)
    is_gateway = Column(Boolean, default=False)
    status = Column(String, default="ONLINE")  # ONLINE, WARNING, CRITICAL, OFFLINE, ERROR
    battery_level = Column(Float, default=95.0)  # 0 - 100 %
    signal_strength_rssi = Column(Integer, default=-68)  # dBm
    last_seen_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    panel = relationship("Panel", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")
    
    # Mesh self-relationship
    children = relationship("SensorNode", backref="parent", remote_side=[id])
