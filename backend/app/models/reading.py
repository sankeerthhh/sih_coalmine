from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    node_id = Column(String, ForeignKey("sensor_nodes.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    tilt_x = Column(Float, default=0.0)
    tilt_y = Column(Float, default=0.0)
    displacement = Column(Float, default=0.0)  # mm
    vibration = Column(Float, default=0.0)     # mm/s RMS
    crack_detected = Column(Boolean, default=False)
    battery_level = Column(Float, default=100.0)
    signal_strength = Column(Integer, default=-70)
    anomaly_score = Column(Float, default=0.0) # 0.0 to 1.0 from AI pipeline
    is_outlier = Column(Boolean, default=False)

    sensor = relationship("SensorNode", back_populates="readings")

Index("idx_sensor_node_timestamp", SensorReading.node_id, SensorReading.timestamp)
