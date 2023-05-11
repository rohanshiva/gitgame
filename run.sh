#!/usr/bin/bash
run_api(){
    cd ./api;
    python3.10 main.py
}

run_web(){
    cd ./client;
    npx serve build > website.log
}

run_api & run_web
