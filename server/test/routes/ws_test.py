from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_make_session_invalid_authors():
    response = client.post(
        "/session/make",
        headers={"accept": "application/json", "Content-Type": "application/json"},
        json=["rohanshiva", "ramko9999", "ramko99", "ramko989"],
    )
    assert response.status_code == 422
    assert (
        response.json()["detail"]
        == "Failed to make a session due to invalid usernames: ['ramko99', 'ramko989']"
    )

def test_join_session_invalid_session_id():
    session_id = "wrong_session_id"
    username = "ramko9999"
    socket_url = f"/socket/{session_id}/{username}"
    with client.websocket_connect(socket_url) as websocket:
        data = websocket.receive_json()
        assert data == {"error": f"invalid session_id: {session_id}"}


def test_join_session_invalid_username():
    response = client.post(
        "/session/make",
        headers={"accept": "application/json", "Content-Type": "application/json"},
        json=["rohanshiva", "ramko9999"],
    )
    assert response.status_code == 201
    session_id = response.json()["id"]
    invalid_username = "ramko99"
    socket_url = f"/socket/{session_id}/{invalid_username}"
    with client.websocket_connect(socket_url) as websocket:
        data = websocket.receive_json()
        assert data == {"error": f"invalid username: {invalid_username}"}
