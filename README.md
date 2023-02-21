# Gitgame Server

This backend application, built on Python and FastApi, powers the actual Gitgame. Follow the below steps if you want to set it up on your own computer.


## Setup

Ensure you navigate into the server folder
```
cd ./server
```

Ensure you have virtualenv installed
```
pip install virtualenv
```

Create a new virtualenv and install the packages listed in requirements.txt
```
virtualenv venv
pip install -r requirements.txt
```

Before running the tests, we have to locally install the package gitgame (./server/gitgame) into our virtualenv. This is the package which contains the
source code of the application.
```
pip install -e .
```

Run the tests to ensure the files compile by simply running `pytest`
```
pytest
```

The FastApi application can be started by running ./server/main.py.
```
python main.py
```


Local Testing Without Auth

```
python main.py -d
```

To impersonate a user, open a new private browser window and visit the following URL

```
http://127.0.0.1:8001/user/impersonate/<username>
```

Doing this will set an auth token cookie for the user. 

After impersonating the user, you can use the app regularly. 

