import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_full_resolution_workflow():
    # 1. Report an Issue
    new_issue = {
        "title": "Broken classroom study bench and damaged ceiling switch",
        "description": "Student wooden bench cracked with sharp splinters and wall electrical switch broken in Hall 2",
        "location_type": "College / University",
        "institution_id": "INST-001",
        "institution_name": "National Institute of Engineering & Technology",
        "category": "College Issues",
        "latitude": 12.9719,
        "longitude": 77.6412,
        "address": "Hall 2, Engineering Block",
        "ward": "Ward 4 - Indiranagar",
        "reporter_name": "Sanjay Rao",
        "reporter_contact": "9845011999"
    }

    create_res = client.post("/api/complaints", json=new_issue)
    assert create_res.status_code == 200
    created = create_res.json()
    ticket_id = created["id"]
    assert ticket_id.startswith("CIVIC-")
    assert created["status"] in ["AI Analyzed", "Assigned"]
    assert created["assigned_team_id"] is not None

    # 2. Team moves ticket to In Progress
    progress_res = client.post(f"/api/field-ops/start-work/{ticket_id}")
    assert progress_res.status_code == 200
    assert progress_res.json()["complaint"]["status"] == "In Progress"

    # 3. Field Team resolves issue with notes and materials used
    resolve_payload = {
        "resolution_notes": "Replaced wall switch and replaced wooden bench top with new laminate plank.",
        "resolution_photo_url": "/static/uploads/sample_resolved.jpg",
        "actor": "Institutional Facilities Response Unit",
        "materials_used": [
            {
                "complaint_id": ticket_id,
                "item_id": "INV-006",
                "quantity_used": 1,
                "notes": "Electrical component replacement"
            }
        ]
    }

    resolve_res = client.post(f"/api/complaints/{ticket_id}/resolve", json=resolve_payload)
    assert resolve_res.status_code == 200
    resolved = resolve_res.json()
    assert resolved["status"] == "Resolved"
    assert resolved["resolved_at"] is not None
    assert resolved["resolution_notes"] is not None

    # 4. Track Complaint confirms resolution
    track_res = client.get(f"/api/complaints/track/{ticket_id}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["complaint"]["status"] == "Resolved"
    # Stage 4 (Resolved) should be completed
    assert track_data["stages"][4]["completed"] is True
