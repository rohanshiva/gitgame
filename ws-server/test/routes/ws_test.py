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
    assert response.json()["detail"] == "invalid usernames: ['ramko99', 'ramko989']"


def test_join_session_invalid_session_id():
    session_id = "wrong_session_id"
    username = "ramko9999"
    socket_url = f"/socket/{session_id}/{username}"
    with client.websocket_connect(socket_url) as websocket:
        data = websocket.receive_json()
        assert data == {"error": f"The session with code {session_id} does not exist"}


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
        assert data == {
            "error": f"The username {invalid_username} is an invalid Github username"
        }


def test_join_session():
    response = client.post(
        "/session/make",
        headers={"accept": "application/json", "Content-Type": "application/json"},
        json=["rohanshiva", "ramko9999"],
    )
    assert response.status_code == 201
    session_id = response.json()["id"]
    username = "TanushN"
    socket_url = f"/socket/{session_id}/{username}"

    with client.websocket_connect(socket_url) as websocket:
        websocket.receive_json()
        response = client.get(
            f"/session/{session_id}", headers={"accept": "application/json"}
        )
        assert response.status_code == 200
        response_data = response.json()

        response_authors = response_data["authors"]
        response_players = response_data["players"]
        assert response_players == [username]
        assert response_authors == ["rohanshiva", "ramko9999", username]
