import pytest
from types import SimpleNamespace
from backend.ai.duplicate import duplicate_detector, haversine_distance

def test_haversine_distance():
    # Approx 1 km
    dist = haversine_distance(12.9716, 77.5946, 12.9806, 77.5946)
    assert 900 <= dist <= 1100

def test_duplicate_detected_within_radius():
    existing = [
        SimpleNamespace(
            id="CIVIC-2026-9001",
            title="Dangerous pothole on 100ft road",
            description="Deep crater near junction 12th main",
            latitude=12.9720,
            longitude=77.6410,
            category="Roads & Potholes",
            status="In Progress",
            institution_id=None
        )
    ]

    is_dup, match_id, score, reason = duplicate_detector.check_duplicate(
        new_title="Deep pothole crater on 100ft road",
        new_desc="Crater near 12th main junction causing vehicle damage",
        new_lat=12.9721,
        new_lng=77.6411,
        new_category="Roads & Potholes",
        new_institution_id=None,
        existing_complaints=existing
    )

    assert is_dup is True
    assert match_id == "CIVIC-2026-9001"
    assert score > 0.35

def test_distinct_issue_not_duplicate():
    existing = [
        SimpleNamespace(
            id="CIVIC-2026-9001",
            title="Broken streetlight in Indiranagar",
            description="Dark pole outside house 44",
            latitude=12.9720,
            longitude=77.6410,
            category="Streetlights",
            status="In Progress",
            institution_id=None
        )
    ]

    is_dup, match_id, score, reason = duplicate_detector.check_duplicate(
        new_title="Water pipe burst leaking clean water",
        new_desc="High pressure water line burst in Whitefield",
        new_lat=12.9860,
        new_lng=77.7300,
        new_category="Water Supply",
        new_institution_id=None,
        existing_complaints=existing
    )

    assert is_dup is False
