#!/bin/bash
set -e

# Create systemd service
sudo tee /etc/systemd/system/vsfashion.service > /dev/null << 'SERVICEEOF'
[Unit]
Description=VS Fashion FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/VS/backend
Environment=PATH=/home/ubuntu/VS/backend/venv/bin
ExecStart=/home/ubuntu/VS/backend/venv/bin/gunicorn server:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Configure Nginx
sudo tee /etc/nginx/sites-available/vsfashion > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        proxy_set_header Host $host;
    }

    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/vsfashion /etc/nginx/sites-enabled/vsfashion
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl daemon-reload
sudo systemctl enable vsfashion
sudo systemctl restart vsfashion
sleep 3
sudo systemctl status vsfashion --no-pager
echo "===== BACKEND DEPLOYED ====="
