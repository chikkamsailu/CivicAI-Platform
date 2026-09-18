import pytest
from backend.ai.priority import priority_predictor

def test_critical_hazard_detection():
    text = "High tension live wire sparking on ground in rain"
    pri, reason = priority_predictor.predict(text, category="Electrical")
    assert pri == "Critical"
    assert "Critical" in reason

def test_school_vulnerability_elevation():
    text = "Toilet choked with flooding in primary school restroom"
    pri, reason = priority_predictor.predict(text, category="School Issues", location_type="School")
    assert pri == "Critical"
    assert "School" in reason or "Critical" in pri

def test_routine_issue_priority():
    text = "Streetlight timer broken so light stays on during daytime"
    pri, reason = priority_predictor.predict(text, category="Streetlights")
    assert pri in ["Low", "Medium"]
