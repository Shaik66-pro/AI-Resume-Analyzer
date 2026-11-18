#!/bin/bash
# ========================================================
# AWS EC2 Quick Deploy Script for AI Resume Analyzer
# Target OS: Ubuntu 22.04 LTS on AWS EC2 (Free Tier t2.micro)
# ========================================================

echo ">>> Updating Ubuntu packages..."
sudo apt update -y && sudo apt upgrade -y

echo ">>> Installing Python, pip, MySQL, and Nginx..."
sudo apt install -y python3 python3-pip python3-venv mysql-server nginx git curl

echo ">>> Starting and enabling MySQL service..."
sudo systemctl start mysql
sudo systemctl enable mysql

echo ">>> Initializing MySQL Database for AI Resume Analyzer..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS resume_analyzer_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'analyzer_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'ResumePass123!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON resume_analyzer_db.* TO 'analyzer_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo ">>> Running schema setup..."
sudo mysql resume_analyzer_db < backend/schema.sql

echo ">>> Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
pip install gunicorn

echo ">>> Creating .env file for backend..."
cat <<EOT > backend/.env
DB_HOST=localhost
DB_USER=analyzer_user
DB_PASSWORD=ResumePass123!
DB_NAME=resume_analyzer_db
DB_PORT=3306
EOT

echo ">>> Installing Node.js & building React frontend..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
cd frontend
npm install
npm run build
cd ..

echo ">>> Configuring Nginx to serve frontend and proxy backend API..."
sudo cat <<EOT | sudo tee /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    # Serve React Frontend Build
    root $(pwd)/frontend/build;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    # Proxy Flask Backend API calls
    location /reports {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /analyze {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOT

sudo systemctl restart nginx

echo ">>> Creating Systemd service for Flask Backend (Gunicorn)..."
sudo cat <<EOT | sudo tee /etc/systemd/system/resume-analyzer.service
[Unit]
Description=Gunicorn instance to serve AI Resume Analyzer
After=network.target

[Service]
User=$USER
WorkingDirectory=$(pwd)/backend
Environment="PATH=$(pwd)/venv/bin"
ExecStart=$(pwd)/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5000 app:app

[Install]
WantedBy=multi-user.target
EOT

sudo systemctl daemon-reload
sudo systemctl start resume-analyzer
sudo systemctl enable resume-analyzer

echo "========================================================"
echo ">>> DEPLOYMENT COMPLETE!"
echo ">>> Open your browser and navigate to: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || curl -s ifconfig.me)"
echo "========================================================"
