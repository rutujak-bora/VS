# AWS Deployment Guide

This guide outlines the steps to deploy the VS Fashion e-commerce platform (React frontend and FastAPI backend) to an AWS EC2 instance running Ubuntu.

## Prerequisites
1. An AWS Account.
2. A launched EC2 Instance (Ubuntu 22.04 LTS or newer) with SSH access.
3. Security Group configured to allow inbound traffic on:
   - **Port 22** (SSH)
   - **Port 80** (HTTP)
   - **Port 443** (HTTPS - if using SSL/TLS)

---

## 1. Initial Server Setup

SSH into your AWS instance and update the system:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git build-essential nginx python3-pip python3-venv -y
```

Install Node.js (for building the frontend if you don't use your local `build` folder):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 2. Clone the Repository
Upload your `vs-main` folder or clone your project repository into the home directory of the Ubuntu server:
```bash
cd ~
# If using git:
git clone <your-repository-url> vs-main
cd vs-main
```

---

## 3. Backend Deployment (FastAPI)

We will use `Uvicorn` managed by a `Systemd` service to keep it running continuously in the background.

1. **Setup Python Virtual Environment & Install Dependencies:**
```bash
cd ~/vs-main/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn  # Recommended for production management
```

2. **Configure Environment Variables:**
Create the production `.env` file:
```bash
nano .env
```
Add the following, ensuring you update the URLs and secrets:
```ini
MONGO_URL="mongodb+srv://ecom:ecom2025@cluster0.u71qns3.mongodb.net/"
DB_NAME="test_database"
CORS_ORIGINS="http://your-ec2-ip-or-domain"
JWT_SECRET="YOUR_SUPER_SECURE_SECRET_KEY"
GMAIL_USER="kawadeu45@gmail.com"
GMAIL_APP_PASSWORD="your_app_password"
BACKEND_URL="http://your-ec2-ip-or-domain/api"
```

3. **Create a Systemd Service:**
```bash
sudo nano /etc/systemd/system/fastapi.service
```
Add the following configuration (replace `ubuntu` with your actual username if different):
```ini
[Unit]
Description=Gunicorn process to serve FastAPI
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/vs-main/backend
Environment="PATH=/home/ubuntu/vs-main/backend/venv/bin"
ExecStart=/home/ubuntu/vs-main/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4

[Install]
WantedBy=multi-user.target
```

4. **Start and enable the Backend Service:**
```bash
sudo systemctl daemon-reload
sudo systemctl start fastapi
sudo systemctl enable fastapi
sudo systemctl status fastapi
```

---

## 4. Frontend Deployment (React)

The frontend needs to be built with the production Backend API URL, and then served securely using Nginx.

1. **Set Environment Variables:**
```bash
cd ~/vs-main/frontend
nano .env
```
Ensure the API points to your server's exposed endpoint (via Nginx proxy):
```ini
REACT_APP_BACKEND_URL=http://your-ec2-ip-or-domain
```

2. **Build the Frontend:**
```bash
npm install
npm run build
```
This generates a `build/` folder containing the static, production-ready frontend.

---

## 5. Nginx Configuration (Reverse Proxy & Static File Serving)

Nginx will serve the React `build` folder on port 80 and route any `/api` requests to the FastAPI backend running on port 8000.

1. **Create an Nginx Server Block:**
```bash
sudo nano /etc/nginx/sites-available/vsfashion
```
Paste the following configuration:
```nginx
server {
    listen 80;
    server_name your-ec2-ip-or-domain;

    # Serve the React Frontend
    location / {
        root /home/ubuntu/vs-main/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy for the FastAPI Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Reverse Proxy for Uploaded Images
    location /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        proxy_set_header Host $host;
    }
}
```

2. **Enable the Configuration and Restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/vsfashion /etc/nginx/sites-enabled/
# Remove the default nginx config to avoid conflicts
sudo rm /etc/nginx/sites-enabled/default
# Test the configuration
sudo nginx -t
# Restart Nginx
sudo systemctl restart nginx
```

---

## 6. Accessing Your Application
Your application is now fully deployed!
You can access it by typing your AWS EC2 Public IPv4 Address into your web browser. 

*Optional*: If you assign a domain name via Route 53, update Nginx `server_name` and `.env` files accordingly. It is highly recommended to secure the site with HTTPS using **Certbot** (`sudo apt install certbot python3-certbot-nginx` -> `sudo certbot --nginx`).
