from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_dashboard():
    response = client.get("/dashboard")
    assert response.status_code == 200
    assert "CodeRaksh Hub" in response.text


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["valid"] is True


def test_blueprints_are_paginated():
    response = client.get("/api/blueprints?limit=2")
    body = response.json()
    assert response.status_code == 200
    assert body["total"] >= 20
    assert len(body["items"]) == 2
    assert body["items"][0]["node_count"] >= 0


def test_blueprints_can_be_filtered():
    response = client.get("/api/blueprints?domain=sales")
    assert response.status_code == 200
    assert response.json()["total"] >= 4
    assert all(item["domain"] == "sales" for item in response.json()["items"])


def test_search_and_stats():
    response = client.get("/api/v1/blueprints?search=sales&sort=node_count&descending=true")
    assert response.status_code == 200
    assert response.json()["total"] >= 4
    stats = client.get("/api/v1/stats")
    assert stats.status_code == 200
    assert stats.json()["total"] >= 20
    assert stats.json()["total_nodes"] >= 0


def test_ready():
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"


def test_blueprint_not_found():
    response = client.get("/api/blueprints/does-not-exist")
    assert response.status_code == 404


def test_validation():
    response = client.post("/api/validate")
    assert response.status_code == 200
    assert response.json()["valid"] is True
    assert response.json()["checked_files"] >= 20
    assert response.json()["score"] >= 0


def test_security_headers():
    response = client.get("/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
