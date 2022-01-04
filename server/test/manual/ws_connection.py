import requests
import time
import json

# postman is where the ws connections are made, this is just to create the session and every 5 seconds write out the session data
# to file

resp = requests.post("http://localhost:8000/session/make", json=[]).json()
session_id = resp["id"]
print(session_id)

while True:
    time.sleep(1)
    resp = requests.get(f"http://localhost:8000/session/{session_id}").json()
    with open("./ws_conn.json", "w") as f:
        json.dump(resp, f, indent=2, ensure_ascii=True)
