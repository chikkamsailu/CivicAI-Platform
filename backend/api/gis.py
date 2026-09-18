from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Complaint, Institution
from backend.schemas import ComplaintOut, InstitutionOut

router = APIRouter(prefix="/api/gis", tags=["GIS & Geo-Intelligence"])

@router.get("/map-data")
def get_gis_map_data(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    ward: Optional[str] = None,
    location_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns full spatial dataset for Leaflet GIS Command Center:
    - Geo-tagged issues with severity indicators
    - Registered institutional campuses
    - Computed density hotspot clusters
    """
    query = db.query(Complaint)
    if category and category != "All":
        query = query.filter(Complaint.category == category)
    if priority and priority != "All":
        query = query.filter(Complaint.priority == priority)
    if status and status != "All":
        query = query.filter(Complaint.status == status)
    if ward and ward != "All":
        query = query.filter(Complaint.ward == ward)
    if location_type and location_type != "All":
        query = query.filter(Complaint.location_type == location_type)

    complaints = query.all()
    institutions = db.query(Institution).all()

    # Build Geo-Markers
    markers = []
    for c in complaints:
        markers.append({
            "id": c.id,
            "title": c.title,
            "description": c.description[:120] + "..." if len(c.description) > 120 else c.description,
            "category": c.category,
            "priority": c.priority,
            "status": c.status,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "address": c.address,
            "ward": c.ward,
            "location_type": c.location_type,
            "institution_name": c.institution_name,
            "photo_url": c.photo_url,
            "is_duplicate": c.is_duplicate,
            "created_at": c.created_at.strftime("%b %d, %Y")
        })

    # Build Institutions Geo-Layer
    inst_markers = []
    for inst in institutions:
        inst_markers.append({
            "id": inst.id,
            "name": inst.name,
            "type": inst.type,
            "ward": inst.ward,
            "address": inst.address,
            "latitude": inst.latitude,
            "longitude": inst.longitude,
            "contact_person": inst.contact_person
        })

    # Cluster Hotspots by Ward
    ward_clusters = {}
    for c in complaints:
        w = c.ward
        if w not in ward_clusters:
            ward_clusters[w] = {
                "ward": w,
                "lats": [],
                "lngs": [],
                "count": 0,
                "critical": 0,
                "high": 0
            }
        ward_clusters[w]["lats"].append(c.latitude)
        ward_clusters[w]["lngs"].append(c.longitude)
        ward_clusters[w]["count"] += 1
        if c.priority == "Critical":
            ward_clusters[w]["critical"] += 1
        elif c.priority == "High":
            ward_clusters[w]["high"] += 1

    hotspots = []
    for w, data in ward_clusters.items():
        if data["count"] > 0:
            avg_lat = sum(data["lats"]) / len(data["lats"])
            avg_lng = sum(data["lngs"]) / len(data["lngs"])
            severity_index = (data["critical"] * 3) + (data["high"] * 2) + data["count"]
            hotspots.append({
                "ward": w,
                "latitude": round(avg_lat, 6),
                "longitude": round(avg_lng, 6),
                "issue_count": data["count"],
                "critical_count": data["critical"],
                "high_count": data["high"],
                "severity_index": severity_index,
                "radius_meters": min(1200, 300 + (data["count"] * 100))
            })

    hotspots.sort(key=lambda x: x["severity_index"], reverse=True)

    return {
        "markers": markers,
        "institutions": inst_markers,
        "hotspots": hotspots,
        "total_active_markers": len(markers)
    }
