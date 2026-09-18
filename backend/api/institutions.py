from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import Institution, Complaint
from backend.schemas import InstitutionOut, ComplaintOut

router = APIRouter(prefix="/api/institutions", tags=["Institutions"])

@router.get("", response_model=List[InstitutionOut])
def list_institutions(type: Optional[str] = None, ward: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieves all registered institutions along with live complaint statistics."""
    query = db.query(Institution)
    if type and type != "All":
        query = query.filter(Institution.type == type)
    if ward and ward != "All":
        query = query.filter(Institution.ward == ward)

    institutions = query.all()
    results = []

    for inst in institutions:
        complaints = db.query(Complaint).filter(Complaint.institution_id == inst.id).all()
        
        total = len(complaints)
        open_count = sum(1 for c in complaints if c.status in ["Submitted", "AI Analyzed", "Assigned"])
        in_prog = sum(1 for c in complaints if c.status == "In Progress")
        resolved = sum(1 for c in complaints if c.status in ["Resolved", "Verified"])
        critical = sum(1 for c in complaints if c.priority == "Critical")

        results.append(InstitutionOut(
            id=inst.id,
            name=inst.name,
            type=inst.type,
            ward=inst.ward,
            address=inst.address,
            latitude=inst.latitude,
            longitude=inst.longitude,
            contact_person=inst.contact_person,
            contact_email=inst.contact_email,
            contact_phone=inst.contact_phone,
            total_issues=total,
            open_issues=open_count,
            in_progress_issues=in_prog,
            resolved_issues=resolved,
            critical_issues=critical
        ))

    return results

@router.get("/{id}")
def get_institution_details(id: str, db: Session = Depends(get_db)):
    """Retrieves institution details with its full complaint docket."""
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    complaints = db.query(Complaint).filter(Complaint.institution_id == id).order_by(desc(Complaint.created_at)).all()
    
    total = len(complaints)
    open_count = sum(1 for c in complaints if c.status in ["Submitted", "AI Analyzed", "Assigned"])
    in_prog = sum(1 for c in complaints if c.status == "In Progress")
    resolved = sum(1 for c in complaints if c.status in ["Resolved", "Verified"])
    critical = sum(1 for c in complaints if c.priority == "Critical")

    return {
        "institution": InstitutionOut(
            id=inst.id,
            name=inst.name,
            type=inst.type,
            ward=inst.ward,
            address=inst.address,
            latitude=inst.latitude,
            longitude=inst.longitude,
            contact_person=inst.contact_person,
            contact_email=inst.contact_email,
            contact_phone=inst.contact_phone,
            total_issues=total,
            open_issues=open_count,
            in_progress_issues=in_prog,
            resolved_issues=resolved,
            critical_issues=critical
        ),
        "complaints": [ComplaintOut.from_orm(c) for c in complaints]
    }
