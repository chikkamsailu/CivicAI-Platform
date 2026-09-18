from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from backend.database import Base

class Institution(Base):
    __tablename__ = 'institutions'

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    type = Column(String(100), nullable=False, index=True)
    ward = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_person = Column(String(100), default='Facilities Administrator')
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

