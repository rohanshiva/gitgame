#!/usr/bin/bash
run_api(){
    cd ./api;
    python3.10 main.py
}

run_web(){
    cd ./client;
    npx serve build > website.log
}

source ~/.nvm/nvm.sh
run_api & run_web
