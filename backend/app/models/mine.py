from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Mine(Base):
    __tablename__ = "mines"

    id = Column(String, primary_key=True, index=True)  # e.g., "MINE-SECL-KORBA"
    name = Column(String, nullable=False)
    organization = Column(String, default="Ministry of Coal, Government of India")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    boundary_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    panels = relationship("Panel", back_populates="mine", cascade="all, delete-orphan")
