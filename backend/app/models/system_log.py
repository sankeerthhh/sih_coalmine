from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    component = Column(String, nullable=False, index=True) # GATEWAY, AI_ENGINE, DATABASE, MESH, MQTT, API
    event_type = Column(String, nullable=False) # INFO, WARNING, ERROR, SYNC
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
