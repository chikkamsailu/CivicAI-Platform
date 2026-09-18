from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text
from backend.database import Base

class Complaint(Base):
    __tablename__ = 'complaints'

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location_type = Column(String(100), nullable=False, default='Public / Community')
    institution_id = Column(String(50), ForeignKey('institutions.id'), nullable=True)
    institution_name = Column(String(200), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    predicted_category = Column(String(100), nullable=True)
    category_confidence = Column(Float, default=0.0)
    priority = Column(String(50), nullable=False, default='Medium', index=True)
    predicted_priority = Column(String(50), nullable=True)
    priority_reason = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default='Submitted', index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=False)
    landmark = Column(String(200), nullable=True)
    ward = Column(String(100), nullable=False, index=True)
    photo_url = Column(String(255), nullable=True)
    resolution_photo_url = Column(String(255), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    reporter_name = Column(String(100), default='Citizen')
    reporter_contact = Column(String(100), nullable=True)
    assigned_team_id = Column(String(50), ForeignKey('field_teams.id'), nullable=True)
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(String(50), nullable=True)
    duplicate_similarity = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(50), ForeignKey('complaints.id'), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    actor = Column(String(100), default='System')
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

