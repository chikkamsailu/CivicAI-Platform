from sqlalchemy import Column, String, Integer
from backend.database import Base

class FieldTeam(Base):
    __tablename__ = 'field_teams'

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    department = Column(String(100), nullable=False, index=True)
    lead_name = Column(String(100), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    assigned_zone = Column(String(100), nullable=False)
    specialization = Column(String(200), nullable=False)
    active_workload = Column(Integer, default=0)
    max_capacity = Column(Integer, default=10)
    status = Column(String(50), default='Active')

