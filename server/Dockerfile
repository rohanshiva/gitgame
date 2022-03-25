# 
FROM python:3.9

# 
WORKDIR /code

# 
COPY ./requirements.txt /code/requirements.txt

# 
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 
COPY ./gitgame /code/gitgame

COPY ./main.py /code/main.py

COPY ./__init__.py /code/__init__.py

COPY .env /code/.env

COPY ./config.py /code/config.py

COPY ./log.ini /code/log.ini

COPY ./setup.py /code/setup.py

RUN pip install -e /code

# 
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]