# Gitgame API

This backend application, built on Python and FastApi, powers the actual Gitgame. Follow the below steps if you want to set it locally


## Setup
Create a new virtualenv ([documentation](https://docs.python.org/3/library/venv.html)) and activate it. Next, install the packages listed in requirements.txt
```
pip install -r requirements.txt
```

Run the tests as a quick check to ensure the app works by invoking `pytest`
```
pytest
```

The application can be started by running:
```
python main.py
```

For manual testing, the application can be run via the `-d` option. This turns off Github authentication, but at the present, HTTP-only cookie verification is still present.

```
python main.py -d
```

To impersonate a user, open a new private browser window and visit the following URL

```
http://127.0.0.1:8001/user/impersonate/<username>
```

The API will redirect to the client with the cookie configured for the user, thus future cookie transport from the client will pass on the API side and you will be able to use the app regularly.
