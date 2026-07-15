#!/bin/bash
# Create 2GB swap file to prevent memory crash on e2-micro (1GB RAM)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# System updates and dependencies
apt-get update -y
apt-get install -y curl unzip git

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify Node.js and NPM installation
node -v >> /var/log/node_version.log
npm -v >> /var/log/npm_version.log

# Create application directory
mkdir -p /app
cd /app

# Download backend ZIP from GCS
gcloud storage cp gs://automate-social-media-464001-source-bucket/backend.zip backend.zip
unzip -o backend.zip
rm backend.zip

# Create .env file for production
cat << 'EOF' > .env
PORT=80
MODEL_URL=https://storage.googleapis.com/submissionmlgc-yanwar-model/model.json
EOF

# Install dependencies (production only)
npm install --production

# Create systemd service file for Asclepius Backend
cat << 'EOF' > /etc/systemd/system/asclepius-backend.service
[Unit]
Description=Asclepius Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/app
ExecStart=/usr/bin/npm start
Restart=always
Environment=PORT=80
Environment=MODEL_URL=https://storage.googleapis.com/submissionmlgc-yanwar-model/model.json

[Install]
WantedBy=multi-user.target
EOF

# Load, enable and start the service
systemctl daemon-reload
systemctl enable asclepius-backend.service
systemctl start asclepius-backend.service
