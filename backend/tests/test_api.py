from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"


def test_invalid_analysis_request():
    response = client.post("/api/nutrition/analyze", json={"nutrition": {"protein_g": -2}, "quantity": 1})
    assert response.status_code == 422


def test_manual_entry_analysis():
    response = client.post("/api/nutrition/analyze", json={
        "nutrition": {"product_name": "Manual item", "nutrition_basis": "per_serving", "protein_g": 7},
        "quantity": 3,
    })
    assert response.status_code == 200
    assert response.json()["totals"]["protein_g"] == 21


def test_empty_ocr_request():
    assert client.post("/api/ocr/extract").status_code == 422
