import os
import random
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import Complaint, AuditLog, FieldTeam, Institution, InventoryItem, MaterialConsumption
from backend.schemas import ComplaintCreate, ComplaintUpdate, ComplaintOut, AuditLogOut, WorkOrderResolveRequest
from backend.ai import classifier, priority_predictor, duplicate_detector, team_recommender

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def generate_ticket_id() -> str:
    year = datetime.utcnow().year
    rand_num = random.randint(1000, 9999)
    return f"CIVIC-{year}-{rand_num}"

@router.post("/upload", response_model=dict)
async def upload_photo(file: UploadFile = File(...)):
    """Uploads an image file for a complaint or resolution proof."""
    try:
        ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
        unique_filename = f"photo_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{random.randint(100, 999)}{ext}"
        filepath = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_url = f"/static/uploads/{unique_filename}"
        return {"filename": unique_filename, "url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.post("", response_model=ComplaintOut)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a new civic or institutional complaint.
    Automatically applies Scikit-Learn AI classification, priority prediction,
    spatial-text duplicate detection, and smart team assignment.
    """
    # 1. AI Category Classification
    pred_cat, cat_conf = classifier.predict(f"{payload.title} {payload.description}")

    # 2. AI Priority Estimation
    pred_priority, priority_reason = priority_predictor.predict(
        f"{payload.title} {payload.description}",
        category=payload.category or pred_cat,
        location_type=payload.location_type
    )

    # 3. AI Duplicate Detection against open complaints
    active_complaints = db.query(Complaint).filter(Complaint.status.notin_(["Resolved", "Verified"])).all()
    is_dup, dup_id, dup_sim, dup_reason = duplicate_detector.check_duplicate(
        new_title=payload.title,
        new_desc=payload.description,
        new_lat=payload.latitude,
        new_lng=payload.longitude,
        new_category=payload.category or pred_cat,
        new_institution_id=payload.institution_id,
        existing_complaints=active_complaints
    )

    # 4. Smart Team Recommendation
    all_teams = db.query(FieldTeam).all()
    rec_team_id, rec_team_name, rec_reason = team_recommender.recommend_team(
        category=payload.category or pred_cat,
        location_type=payload.location_type,
        ward=payload.ward,
        teams=all_teams
    )

    ticket_id = generate_ticket_id()
    
    # Ensure unique ticket ID
    while db.query(Complaint).filter(Complaint.id == ticket_id).first():
        ticket_id = generate_ticket_id()

    # Create complaint record
    complaint = Complaint(
        id=ticket_id,
        title=payload.title,
        description=payload.description,
        location_type=payload.location_type,
        institution_id=payload.institution_id,
        institution_name=payload.institution_name,
        category=payload.category or pred_cat,
        predicted_category=pred_cat,
        category_confidence=cat_conf,
        priority=pred_priority,
        predicted_priority=pred_priority,
        priority_reason=priority_reason,
        status="AI Analyzed" if not is_dup else "Submitted",
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        landmark=payload.landmark,
        photo_url=payload.photo_url,
        ward=payload.ward,
        reporter_name=payload.reporter_name or "Citizen",
        reporter_contact=payload.reporter_contact,
        assigned_team_id=rec_team_id,
        is_duplicate=is_dup,
        duplicate_of_id=dup_id,
        duplicate_similarity=dup_sim,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(complaint)

    # If team assigned, increment workload
    if rec_team_id:
        team = db.query(FieldTeam).filter(FieldTeam.id == rec_team_id).first()
        if team:
            team.active_workload += 1
            complaint.status = "Assigned"

    # Create initial Audit Log
    audit = AuditLog(
        complaint_id=ticket_id,
        action="Created & AI Processed",
        old_status=None,
        new_status=complaint.status,
        actor="CivicAI Intelligence Pipeline",
        notes=f"Category: {pred_cat} ({int(cat_conf*100)}% conf). Priority: {pred_priority}. Assigned: {rec_team_name or 'Pending'}. {('Potential duplicate of ' + dup_id) if is_dup else 'Unique submission verified.'}"
    )
    db.add(audit)

    db.commit()
    db.refresh(complaint)
    return complaint

@router.get("", response_model=List[ComplaintOut])
def list_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    ward: Optional[str] = None,
    location_type: Optional[str] = None,
    institution_id: Optional[str] = None,
    search: Optional[str] = None,
    is_duplicate: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Lists complaints with dynamic filtering and search."""
    query = db.query(Complaint)

    if status and status != "All":
        query = query.filter(Complaint.status == status)
    if category and category != "All":
        query = query.filter(Complaint.category == category)
    if priority and priority != "All":
        query = query.filter(Complaint.priority == priority)
    if ward and ward != "All":
        query = query.filter(Complaint.ward == ward)
    if location_type and location_type != "All":
        query = query.filter(Complaint.location_type == location_type)
    if institution_id:
        query = query.filter(Complaint.institution_id == institution_id)
    if is_duplicate is not None:
        query = query.filter(Complaint.is_duplicate == is_duplicate)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Complaint.id.ilike(search_fmt)) |
            (Complaint.title.ilike(search_fmt)) |
            (Complaint.description.ilike(search_fmt)) |
            (Complaint.address.ilike(search_fmt)) |
            (Complaint.institution_name.ilike(search_fmt))
        )

    return query.order_by(desc(Complaint.created_at)).offset(offset).limit(limit).all()

@router.get("/{id}", response_model=ComplaintOut)
def get_complaint(id: str, db: Session = Depends(get_db)):
    """Retrieves single complaint by Reference ID."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint reference ID not found")
    return complaint

@router.get("/{id}/audit-logs", response_model=List[AuditLogOut])
def get_complaint_audit_logs(id: str, db: Session = Depends(get_db)):
    """Retrieves full audit trail and resolution history."""
    return db.query(AuditLog).filter(AuditLog.complaint_id == id).order_by(AuditLog.timestamp.asc()).all()

@router.get("/track/{id}")
def track_complaint(id: str, db: Session = Depends(get_db)):
    """Citizen tracking lookup returning progressive lifecycle milestones."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with Reference ID '{id}' was not found.")

    team = db.query(FieldTeam).filter(FieldTeam.id == complaint.assigned_team_id).first() if complaint.assigned_team_id else None
    audit_logs = db.query(AuditLog).filter(AuditLog.complaint_id == id).order_by(AuditLog.timestamp.asc()).all()

    # Lifecycle Milestones calculation
    status_order = ["Submitted", "AI Analyzed", "Assigned", "In Progress", "Resolved", "Verified"]
    current_status = complaint.status
    current_idx = status_order.index(current_status) if current_status in status_order else 0

    stages = [
        {
            "key": "Submitted",
            "label": "Ticket Logged",
            "description": f"Received by CivicAI system on {complaint.created_at.strftime('%b %d, %Y at %I:%M %p')}",
            "completed": current_idx >= 0,
            "current": current_idx == 0
        },
        {
            "key": "AI Analyzed",
            "label": "AI Intelligence Analysis",
            "description": f"Classified as '{complaint.predicted_category or complaint.category}' ({complaint.priority} priority). {complaint.priority_reason or 'Risk assessed.'}",
            "completed": current_idx >= 1,
            "current": current_idx == 1
        },
        {
            "key": "Assigned",
            "label": "Dispatched to Field Operations",
            "description": f"Assigned to {team.name if team else 'Municipal Maintenance Division'}",
            "completed": current_idx >= 2,
            "current": current_idx == 2
        },
        {
            "key": "In Progress",
            "label": "Crew On-Site / Repair Active",
            "description": "Field team actively working on-site to address reported condition.",
            "completed": current_idx >= 3,
            "current": current_idx == 3
        },
        {
            "key": "Resolved",
            "label": "Issue Resolved",
            "description": complaint.resolution_notes or "Work completed and reported by field team.",
            "completed": current_idx >= 4,
            "current": current_idx == 4
        },
        {
            "key": "Verified",
            "label": "Quality Verified & Closed",
            "description": "Verified through photo evidence and citizen sign-off.",
            "completed": current_idx >= 5,
            "current": current_idx == 5
        }
    ]

    return {
        "complaint": ComplaintOut.model_validate(complaint),
        "assigned_team": {
            "name": team.name,
            "lead": team.lead_name,
            "contact": team.contact_phone,
            "department": team.department
        } if team else None,
        "stages": stages,
        "audit_logs": [AuditLogOut.model_validate(log) for log in audit_logs]
    }

@router.patch("/{id}", response_model=ComplaintOut)
def update_complaint(
    id: str,
    payload: ComplaintUpdate,
    db: Session = Depends(get_db)
):
    """Updates complaint status, priority, or field team assignment."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    old_team_id = complaint.assigned_team_id

    if payload.status:
        complaint.status = payload.status
        if payload.status in ["Resolved", "Verified"] and not complaint.resolved_at:
            complaint.resolved_at = datetime.utcnow()
            # Decrement team workload
            if complaint.assigned_team_id:
                team = db.query(FieldTeam).filter(FieldTeam.id == complaint.assigned_team_id).first()
                if team and team.active_workload > 0:
                    team.active_workload -= 1

    if payload.assigned_team_id and payload.assigned_team_id != old_team_id:
        if old_team_id:
            prev_team = db.query(FieldTeam).filter(FieldTeam.id == old_team_id).first()
            if prev_team and prev_team.active_workload > 0:
                prev_team.active_workload -= 1
        new_team = db.query(FieldTeam).filter(FieldTeam.id == payload.assigned_team_id).first()
        if new_team:
            new_team.active_workload += 1
        complaint.assigned_team_id = payload.assigned_team_id
        if complaint.status in ["Submitted", "AI Analyzed"]:
            complaint.status = "Assigned"

    if payload.priority:
        complaint.priority = payload.priority
    if payload.resolution_notes:
        complaint.resolution_notes = payload.resolution_notes
    if payload.resolution_photo_url:
        complaint.resolution_photo_url = payload.resolution_photo_url

    complaint.updated_at = datetime.utcnow()

    # Audit log
    audit = AuditLog(
        complaint_id=id,
        action=f"Updated status to {complaint.status}" if payload.status else "Updated ticket details",
        old_status=old_status,
        new_status=complaint.status,
        actor=payload.actor or "Operator",
        notes=payload.resolution_notes or f"Status shifted from {old_status} to {complaint.status}"
    )
    db.add(audit)

    db.commit()
    db.refresh(complaint)
    return complaint

@router.post("/{id}/resolve", response_model=ComplaintOut)
def resolve_complaint(
    id: str,
    payload: WorkOrderResolveRequest,
    db: Session = Depends(get_db)
):
    """Field operations resolution with notes, photo evidence, and material consumption."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = "Resolved"
    complaint.resolution_notes = payload.resolution_notes
    if payload.resolution_photo_url:
        complaint.resolution_photo_url = payload.resolution_photo_url
    complaint.resolved_at = datetime.utcnow()
    complaint.updated_at = datetime.utcnow()

    # Decrement team workload
    if complaint.assigned_team_id:
        team = db.query(FieldTeam).filter(FieldTeam.id == complaint.assigned_team_id).first()
        if team and team.active_workload > 0:
            team.active_workload -= 1

    # Record material consumption
    if payload.materials_used:
        for mat in payload.materials_used:
            inv_item = db.query(InventoryItem).filter(InventoryItem.id == mat.item_id).first()
            if inv_item:
                inv_item.quantity_in_stock = max(0, inv_item.quantity_in_stock - mat.quantity_used)
                if inv_item.quantity_in_stock <= inv_item.minimum_threshold:
                    inv_item.status = "Low Stock" if inv_item.quantity_in_stock > 0 else "Critical Reorder"
                
                consumption = MaterialConsumption(
                    complaint_id=id,
                    item_id=mat.item_id,
                    quantity_used=mat.quantity_used,
                    notes=mat.notes or "Applied during on-site field resolution"
                )
                db.add(consumption)

    # Audit log
    audit = AuditLog(
        complaint_id=id,
        action="Resolved by Field Operations",
        old_status=old_status,
        new_status="Resolved",
        actor=payload.actor or "Field Operations Crew",
        notes=f"Resolution logged: {payload.resolution_notes}. Materials applied: {len(payload.materials_used or [])} items."
    )
    db.add(audit)

    db.commit()
    db.refresh(complaint)
    return complaint
