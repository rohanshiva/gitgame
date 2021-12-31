from fastapi.testclient import TestClient

from main import app
from server.gitgame.routes import session

client = TestClient(app)


def test_make_session():
    response = client.post(
        "/session/make",
        headers={"accept": "application/json",
                 "Content-Type": "application/json"},
        json=["rohanshiva","ramko9999"],
    )
    assert response.status_code == 201

def test_websocket_connection():
    response = client.post(
        "/session/make",
        headers={"accept": "application/json",
                 "Content-Type": "application/json"},
        json=["rohanshiva","ramko9999"],
    )
    assert response.status_code == 201
    session_id = response.json()["id"]
    username = "TanushN"
    socket_url = f"/socket/{session_id}/{username}"
    with client.websocket_connect(socket_url) as websocket:
        data = websocket.receive_json()
        assert data == {"msg": f"{username} connected lobby {session_id}"}
    response = client.get(f"/session/{session_id}", headers={"accept": "application/json"})
    assert response.status_code == 200
    response_data = response.json()
    response_authors = response_data["authors"]
    response_players = response_data["players"]
    assert response_players == [username]
    assert response_authors == ["rohanshiva", "ramko9999", username]