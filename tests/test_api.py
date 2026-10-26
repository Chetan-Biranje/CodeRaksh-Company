from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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


def test_blueprint_not_found():
    response = client.get("/api/blueprints/does-not-exist")
    assert response.status_code == 404


def test_validation():
    response = client.post("/api/validate")
    assert response.status_code == 200
    assert response.json()["valid"] is True
    assert response.json()["checked_files"] >= 20


def test_security_headers():
    response = client.get("/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
