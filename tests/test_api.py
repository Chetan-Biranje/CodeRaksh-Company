from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'

def test_blueprints_are_listed():
    response = client.get('/api/blueprints')
    assert response.status_code == 200
    assert len(response.json()) >= 20

def test_validation():
    response = client.post('/api/validate')
    assert response.status_code == 200
    assert response.json()['valid'] is True
