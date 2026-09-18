import pytest
from backend.ai.classifier import classifier

def test_classifier_trained():
    assert classifier.model is not None

def test_road_pothole_classification():
    text = "Large deep pothole on arterial ring road causing vehicle tire damage"
    cat, conf = classifier.predict(text)
    assert cat == "Roads & Potholes"
    assert conf > 0.0

def test_electrical_classification():
    text = "Live sparking wire hanging from electricity pole near marketplace"
    cat, conf = classifier.predict(text)
    assert cat == "Electrical"
    assert conf > 0.0

def test_school_issue_classification():
    text = "Classroom ceiling fan wobbling violently and primary school desks broken"
    cat, conf = classifier.predict(text)
    assert cat in ["School Issues", "College Issues", "Electrical"]

def test_empty_string_fallback():
    cat, conf = classifier.predict("")
    assert cat == "Other"
    assert conf >= 0.0
