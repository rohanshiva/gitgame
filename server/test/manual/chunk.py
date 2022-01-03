import requests


def dump_chunk(session_id):
    response = requests.get(f"http://localhost:8000/session/{session_id}/chunk")
    if response.status_code == 500:
        print("Unable to get chunk", response.text)
        return

    chnk = response.json()
    lines = chnk["lines"]
    with open(f"./chunk-test/run.txt", "w") as f:
        for line in lines:
            f.write(f"{line['line_number']} {line['content']}\n")


resp = requests.post("http://localhost:8000/session/make", json=["TanushN", "ramko9999"]).json()
session_id = resp["id"]
print(session_id)

print(requests.get(f"http://localhost:8000/session/{session_id}/pick").status_code)
dump_chunk(session_id)

while True:
    keyboard_input = input().strip()
    if keyboard_input.upper() == "W":
        print(
            requests.get(
                f"http://localhost:8000/session/{session_id}/peek?direction=above"
            ).status_code
        )
        dump_chunk(session_id)
    elif keyboard_input.upper() == "S":
        print(
            requests.get(
                f"http://localhost:8000/session/{session_id}/peek?direction=below"
            ).status_code
        )
        dump_chunk(session_id)
    elif keyboard_input.upper() == "N":
        print(
            requests.get(f"http://localhost:8000/session/{session_id}/pick").status_code
        )
        dump_chunk(session_id)
    elif keyboard_input.upper() == "Q":
        break
