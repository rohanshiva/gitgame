#!/usr/bin/bash
run_api(){
    cd ./api;
    python3.10 main.py
}

run_web(){
    cd ./client;
    npx serve build > website.log
}

API_ENV_FILE=$1
cp $API_ENV_FILE ./api/.env
sudo cp nginx.conf /etc/nginx/conf.d
sudo nginx -s reload
run_api & run_web