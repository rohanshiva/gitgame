#!/usr/bin/bash
run_api(){
    cd ./api;
    nohup python3.10 main.py&
}

run_web(){
    cd ./client;
    nohup npx serve -s build > website.log&
}

kill_existing_runs(){
    # kills any existing python or npx server processes
    kill -9 $(ps aux | grep -i -e "python3.10 main.py" -e "npm exec serve -s build" | grep -v "grep" | awk '{print $2}')
}

run_nginx(){
    sudo cp nginx.conf /etc/nginx/conf.d
    sudo nginx -s reload
}

kill_existing_runs
run_nginx
run_api & run_web
