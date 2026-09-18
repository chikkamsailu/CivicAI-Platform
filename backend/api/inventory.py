from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import InventoryItem, MaterialConsumption, Complaint
from backend.schemas import InventoryItemOut

router = APIRouter(prefix="/api/inventory", tags=["Inventory & Assets"])

class RestockRequest(BaseModel):
    quantity_to_add: int

class ConsumptionLogOut(BaseModel):
    id: int
    complaint_id: str
    item_id: str
    item_name: Optional[str] = None
    quantity_used: int
    logged_at: datetime
    notes: Optional[str] = None

@router.get("", response_model=List[InventoryItemOut])
def list_inventory(category: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists spare parts, materials, and asset stock levels."""
    query = db.query(InventoryItem)
    if category and category != "All":
        query = query.filter(InventoryItem.category == category)
    if status and status != "All":
        query = query.filter(InventoryItem.status == status)
    return query.all()

@router.post("/{id}/restock", response_model=InventoryItemOut)
def restock_item(id: str, payload: RestockRequest, db: Session = Depends(get_db)):
    """Restocks inventory item with incoming material shipments."""
    item = db.query(InventoryItem).filter(InventoryItem.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    item.quantity_in_stock += max(0, payload.quantity_to_add)
    item.last_restocked = datetime.utcnow()
    
    if item.quantity_in_stock > item.minimum_threshold:
        item.status = "In Stock"
    elif item.quantity_in_stock > 0:
        item.status = "Low Stock"
    else:
        item.status = "Critical Reorder"

    db.commit()
    db.refresh(item)
    return item

@router.get("/consumption-history")
def get_consumption_history(db: Session = Depends(get_db)):
    """Retrieves logs of parts and materials utilized across repair jobs."""
    consumptions = db.query(MaterialConsumption).order_by(desc(MaterialConsumption.logged_at)).limit(50).all()
    results = []
    for c in consumptions:
        item = db.query(InventoryItem).filter(InventoryItem.id == c.item_id).first()
        results.append({
            "id": c.id,
            "complaint_id": c.complaint_id,
            "item_id": c.item_id,
            "item_name": item.name if item else "Unknown Asset",
            "quantity_used": c.quantity_used,
            "unit": item.unit if item else "Units",
            "logged_at": c.logged_at,
            "notes": c.notes
        })
    return results
