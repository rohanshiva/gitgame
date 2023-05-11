#!/usr/bin/bash
# setup python
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt install python3.10 python3.10-distutils -y

# install packages to connect to Postgres
sudo apt install libpq-dev gcc python3-dev -y

# install pip
curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.10
sudo python3.10 -m pip install pip --upgrade
echo "Setup Python!"

# checkout production
git fetch origin production
git checkout production

# setup API
cd api/
sudo python3.10 -m pip install -r requirements.txt
echo "Setup API!"

# setup nodejs
sudo apt install nodejs npm xsel -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install lts/hydrogen
nvm use lts/hydrogen

# for serving build/
npm install serve -g
echo "Setup Node!"

# install nginx
sudo apt install nginx -y
sudo unlink /etc/nginx/sites-enabled/default
sudo cp nginx.conf /etc/nginx/conf.d
sudo nginx -s reload
echo "Setup Nginx!"

cp ../api.env ./api/.env
