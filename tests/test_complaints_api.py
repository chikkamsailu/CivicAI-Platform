import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_list_complaints():
    res = client.get("/api/complaints")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_filter_complaints_by_category():
    res = client.get("/api/complaints?category=Roads & Potholes")
    assert res.status_code == 200
    data = res.json()
    assert all(c["category"] == "Roads & Potholes" for c in data)

def test_track_complaint():
    # Fetch first complaint id
    list_res = client.get("/api/complaints?limit=1")
    first_id = list_res.json()[0]["id"]

    track_res = client.get(f"/api/complaints/track/{first_id}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert "complaint" in track_data
    assert "stages" in track_data
    assert len(track_data["stages"]) == 6

def test_ai_pre_analyze_endpoint():
    payload = {
        "title": "Live sparking electrical wire on ground",
        "description": "High tension wire detached from pole sparking near kindergarten",
        "location_type": "School",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "ward": "Ward 4 - Indiranagar"
    }
    res = client.post("/api/ai/pre-analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_category"] in ["Electrical", "School Issues"]
    assert data["predicted_priority"] == "Critical"
    assert data["recommended_team"] is not None
