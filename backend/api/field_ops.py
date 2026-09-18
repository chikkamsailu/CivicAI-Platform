from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import FieldTeam, Complaint, AuditLog
from backend.schemas import FieldTeamOut, ComplaintOut

router = APIRouter(prefix="/api/field-ops", tags=["Field Operations"])

class AssignTeamRequest(BaseModel):
    complaint_id: str
    team_id: str
    actor: Optional[str] = "Field Dispatch Supervisor"
    notes: Optional[str] = None

@router.get("/teams", response_model=List[FieldTeamOut])
def list_teams(department: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists field teams with active workload and capacity."""
    query = db.query(FieldTeam)
    if department and department != "All":
        query = query.filter(FieldTeam.department == department)
    return query.all()

@router.get("/work-orders")
def list_work_orders(
    team_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves work orders for field operations teams."""
    query = db.query(Complaint).filter(Complaint.assigned_team_id.isnot(None))
    
    if team_id and team_id != "All":
        query = query.filter(Complaint.assigned_team_id == team_id)
    if status and status != "All":
        query = query.filter(Complaint.status == status)
    if priority and priority != "All":
        query = query.filter(Complaint.priority == priority)

    complaints = query.order_by(desc(Complaint.created_at)).all()
    
    work_orders = []
    for c in complaints:
        team = db.query(FieldTeam).filter(FieldTeam.id == c.assigned_team_id).first()
        work_orders.append({
            "complaint": ComplaintOut.model_validate(c),
            "team": FieldTeamOut.model_validate(team) if team else None
        })

    return work_orders

@router.post("/assign")
def assign_work_order(payload: AssignTeamRequest, db: Session = Depends(get_db)):
    """Assigns or reassigns a work order to a field squad."""
    complaint = db.query(Complaint).filter(Complaint.id == payload.complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    team = db.query(FieldTeam).filter(FieldTeam.id == payload.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Field team not found")

    old_team_id = complaint.assigned_team_id
    if old_team_id and old_team_id != payload.team_id:
        old_team = db.query(FieldTeam).filter(FieldTeam.id == old_team_id).first()
        if old_team and old_team.active_workload > 0:
            old_team.active_workload -= 1

    complaint.assigned_team_id = payload.team_id
    complaint.status = "Assigned"
    complaint.updated_at = datetime.utcnow()
    team.active_workload += 1

    audit = AuditLog(
        complaint_id=complaint.id,
        action=f"Dispatched to Team: {team.name}",
        old_status=complaint.status,
        new_status="Assigned",
        actor=payload.actor,
        notes=payload.notes or f"Work order routed to {team.name} ({team.department})"
    )
    db.add(audit)
    db.commit()
    db.refresh(complaint)

    return {"message": f"Work order {complaint.id} successfully assigned to {team.name}", "complaint": ComplaintOut.model_validate(complaint)}

@router.post("/start-work/{complaint_id}")
def start_field_work(complaint_id: str, db: Session = Depends(get_db)):
    """Transitions work order to In Progress status when team arrives on-site."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = "In Progress"
    complaint.updated_at = datetime.utcnow()

    audit = AuditLog(
        complaint_id=complaint.id,
        action="Field Work Commenced",
        old_status=old_status,
        new_status="In Progress",
        actor="Field Operations Lead",
        notes="Crew arrived on-site; repair and remediation actively underway."
    )
    db.add(audit)
    db.commit()
    return {"message": f"Complaint {complaint_id} status changed to In Progress", "complaint": ComplaintOut.model_validate(complaint)}

@router.post("/verify/{complaint_id}")
def verify_resolution(complaint_id: str, db: Session = Depends(get_db)):
    """Verifies and confirms work order completion with citizen/supervisor sign-off."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = "Verified"
    complaint.updated_at = datetime.utcnow()

    audit = AuditLog(
        complaint_id=complaint.id,
        action="Work Order Quality Verified",
        old_status=old_status,
        new_status="Verified",
        actor="Quality Assurance Supervisor",
        notes="Resolution proof inspects satisfactorily. Case closed and verified."
    )
    db.add(audit)
    db.commit()
    return {"message": f"Complaint {complaint_id} marked as Verified", "complaint": ComplaintOut.model_validate(complaint)}
