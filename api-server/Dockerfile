# 
FROM python:3.9

# 
WORKDIR /code

RUN echo ls
# 
COPY ./requirements.txt /code/requirements.txt

# 
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 
COPY ./api /code/api

COPY ./main.py /code/main.py

COPY ./__init__.py /code/__init__.py

COPY .env /code/.env

COPY ./config.py /code/config.py

COPY ./log.ini /code/log.ini

COPY ./setup.py /code/setup.py

RUN pip install -e /code