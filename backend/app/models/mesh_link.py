from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.core.database import Base

class MeshLink(Base):
    __tablename__ = "mesh_links"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_node_id = Column(String, ForeignKey("sensor_nodes.id"), nullable=False, index=True)
    target_node_id = Column(String, ForeignKey("sensor_nodes.id"), nullable=False, index=True)
    link_quality_lqi = Column(Integer, default=210) # 0 - 255
    rssi = Column(Integer, default=-68) # dBm
    hop_count = Column(Integer, default=1)
    status = Column(String, default="ACTIVE") # ACTIVE, DEGRADED, BROKEN
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
