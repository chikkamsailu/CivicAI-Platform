from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

# --- Complaints ---
class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    location_type: str = Field("Public / Community")
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    category: str
    latitude: float
    longitude: float
    address: str
    landmark: Optional[str] = None
    ward: str
    reporter_name: Optional[str] = "Citizen"
    reporter_contact: Optional[str] = None

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    assigned_team_id: Optional[str] = None
    priority: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_photo_url: Optional[str] = None
    actor: Optional[str] = "Administrator"

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: str
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    actor: str
    notes: Optional[str] = None
    timestamp: datetime

class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    location_type: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    category: str
    predicted_category: Optional[str] = None
    category_confidence: float = 0.0
    priority: str
    predicted_priority: Optional[str] = None
    priority_reason: Optional[str] = None
    status: str
    latitude: float
    longitude: float
    address: str
    landmark: Optional[str] = None
    ward: str
    photo_url: Optional[str] = None
    resolution_photo_url: Optional[str] = None
    resolution_notes: Optional[str] = None
    reporter_name: str
    reporter_contact: Optional[str] = None
    assigned_team_id: Optional[str] = None
    is_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    duplicate_similarity: float = 0.0
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

# --- AI Pre-Analyze ---
class AIPreAnalyzeRequest(BaseModel):
    title: str
    description: str
    location_type: Optional[str] = "Public / Community"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ward: Optional[str] = None

class AIPreAnalyzeResponse(BaseModel):
    predicted_category: str
    category_confidence: float
    predicted_priority: str
    priority_reason: str
    recommended_team: Optional[str] = None
    recommended_team_id: Optional[str] = None
    potential_duplicate: bool = False
    duplicate_ticket_id: Optional[str] = None
    duplicate_similarity: float = 0.0

# --- Institutions ---
class InstitutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    ward: str
    address: str
    latitude: float
    longitude: float
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    total_issues: Optional[int] = 0
    open_issues: Optional[int] = 0
    in_progress_issues: Optional[int] = 0
    resolved_issues: Optional[int] = 0
    critical_issues: Optional[int] = 0

# --- Field Teams ---
class FieldTeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    department: str
    lead_name: str
    contact_phone: str
    assigned_zone: str
    specialization: str
    active_workload: int
    max_capacity: int
    status: str

# --- Inventory ---
class InventoryItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    unit: str
    quantity_in_stock: int
    minimum_threshold: int
    unit_cost: float
    last_restocked: datetime
    status: str

class MaterialConsumptionCreate(BaseModel):
    complaint_id: str
    item_id: str
    quantity_used: int
    notes: Optional[str] = None

class WorkOrderResolveRequest(BaseModel):
    resolution_notes: str
    resolution_photo_url: Optional[str] = None
    actor: Optional[str] = "Field Operations Crew"
    materials_used: Optional[List[MaterialConsumptionCreate]] = []
