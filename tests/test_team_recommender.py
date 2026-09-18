import pytest
from types import SimpleNamespace
from backend.ai.recommender import team_recommender

def test_team_recommendation_by_category():
    teams = [
        SimpleNamespace(
            id="T-ROAD",
            name="Road Squad",
            department="Roads & Potholes",
            specialization="Asphalt",
            assigned_zone="City-Wide",
            active_workload=2,
            max_capacity=10,
            status="Active"
        ),
        SimpleNamespace(
            id="T-ELEC",
            name="Electrical Squad",
            department="Electrical & Grid Ops",
            specialization="Wiring",
            assigned_zone="City-Wide",
            active_workload=1,
            max_capacity=10,
            status="Active"
        )
    ]

    tid, tname, reason = team_recommender.recommend_team(
        category="Roads & Potholes",
        location_type="Public / Community",
        ward="Ward 4",
        teams=teams
    )

    assert tid == "T-ROAD"
    assert "Road Squad" in tname

def test_team_load_balancing():
    teams = [
        SimpleNamespace(
            id="T1",
            name="Busy Road Squad",
            department="Roads & Potholes",
            specialization="Asphalt",
            assigned_zone="Ward 4",
            active_workload=10,
            max_capacity=10,
            status="Active"
        ),
        SimpleNamespace(
            id="T2",
            name="Available Road Squad",
            department="Roads & Potholes",
            specialization="Asphalt",
            assigned_zone="Ward 4",
            active_workload=1,
            max_capacity=10,
            status="Active"
        )
    ]

    tid, tname, reason = team_recommender.recommend_team(
        category="Roads & Potholes",
        location_type="Public / Community",
        ward="Ward 4",
        teams=teams
    )

    assert tid == "T2"
    assert "Available" in tname
