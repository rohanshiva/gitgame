#!/usr/bin/bash
run_api(){
    cd ./api;
    nohup python3.10 main.py&
}

run_web(){
    cd ./client;
    nohup npx serve -s build > website.log&
}

run_prometheus(){
    cp prometheus.yml ../prometheus-*/prometheus.yml;
    cd ../prometheus-*;
    nohup ./prometheus --config.file=prometheus.yml&
}

run_grafana(){
    nohup ../grafana-*/bin/grafana server --homepath ../grafana-*&
}

kill_existing_runs(){
    # kills any existing python or npx server processes
    kill -9 $(ps aux | grep -i -e "python3.10 main.py" -e "serve -s build" | grep -v "grep" | awk '{print $2}')
    # kill prometheus and grafana
    kill -9 $(ps aux | grep -i -e "prometheus" -e "grafana" | grep -v "grep" | awk '{print $2}')
}

run_nginx(){
    sudo cp nginx.conf /etc/nginx/conf.d
    sudo nginx -s reload
}

kill_existing_runs
run_nginx
run_api & run_web & run_prometheus & run_grafana