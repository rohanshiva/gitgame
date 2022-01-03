from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_make_session():
    response = client.post(
        "/session/make",
        headers={"accept": "application/json", "Content-Type": "application/json"},
        json=["rohanshiva", "ramko9999"],
    )
    assert response.status_code == 201
