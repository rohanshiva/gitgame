#!/usr/bin/bash
run_api(){
    cd ./api;
    nohup python3.10 main.py&
}

run_web(){
    cd ./client;
    nohup npx serve build > website.log&
}

kill_existing_runs(){
    # kills any existing python or npx server processes
    kill -9 $(ps aux | grep -i -e "python3.10 main.py" -e "npm exec serve build" | grep -v "grep" | awk '{print $2}')
}

kill_existing_runs
run_api & run_web
