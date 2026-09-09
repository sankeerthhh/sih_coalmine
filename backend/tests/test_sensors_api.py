import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_root_and_health():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "Ministry of Coal" in data["organization"]

    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "HEALTHY"

def test_auth_login_endpoint():
    # Valid login
    resp = client.post("/api/v1/auth/login", json={
        "email": "admin@coal.gov.in",
        "password": "Admin@Coal2026"
    })
    assert resp.status_code == 200
    token_data = resp.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == "admin@coal.gov.in"

    # Invalid login
    bad_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@coal.gov.in",
        "password": "WrongPassword"
    })
    assert bad_resp.status_code == 401

def test_dashboard_summary():
    resp = client.get("/api/v1/dashboard/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["active_sensor_nodes"] >= 20
    assert "Panel B3" in data["active_panel"]
    assert "Prototype" in data["disclaimer"]

def test_list_sensors_and_mesh():
    sensors_resp = client.get("/api/v1/sensors")
    assert sensors_resp.status_code == 200
    nodes = sensors_resp.json()
    assert len(nodes) == 24

    mesh_resp = client.get("/api/v1/mesh")
    assert mesh_resp.status_code == 200
    mesh = mesh_resp.json()
    assert mesh["total_nodes"] == 24
    assert len(mesh["links"]) > 10

def test_simulator_scenario_trigger():
    resp = client.post("/api/v1/simulator/scenario", json={"scenario": "NORMAL"})
    assert resp.status_code == 200
    status = resp.json()
    assert status["current_scenario"] == "NORMAL"
