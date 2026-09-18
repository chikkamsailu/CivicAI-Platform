import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_institutions_api():
    res = client.get("/api/institutions")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 8
    first = data[0]
    assert "total_issues" in first
    assert "open_issues" in first

def test_inventory_api():
    res = client.get("/api/inventory")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 10
    first = data[0]
    assert "quantity_in_stock" in first
    assert "minimum_threshold" in first

def test_inventory_restock():
    res = client.post("/api/inventory/INV-001/restock", json={"quantity_to_add": 10})
    assert res.status_code == 200
    assert res.json()["quantity_in_stock"] >= 10
