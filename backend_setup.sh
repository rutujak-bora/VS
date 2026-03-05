#!/bin/bash
sudo apt update
sudo apt install -y python3-pip python3-venv nginx git

cd /home/ubuntu
if [ ! -d "VS" ]; then
    git clone https://github.com/rutujak-bora/VS.git
fi
cd VS/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Environment variables will be handled separately
