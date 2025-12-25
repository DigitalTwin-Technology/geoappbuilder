# MapForge Deployment Guide - Hetzner Cloud

This guide walks you through deploying MapForge on a Hetzner Cloud server via SSH.

## Prerequisites

- Hetzner Cloud account
- SSH key pair (public/private)
- Domain name (optional, for SSL)
- Google Gemini API key

---

## Step 1: Create Hetzner Cloud Server

### 1.1 Create Server Instance

1. Log in to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Click **"Add Server"**
3. Configure:
   - **Image**: Ubuntu 22.04 or 24.04 LTS
   - **Type**: 
     - Minimum: CX21 (2 vCPU, 4 GB RAM) - for testing
     - Recommended: CX31 (2 vCPU, 8 GB RAM) - for production
     - Production: CPX31 (4 vCPU, 8 GB RAM) - for heavy load
   - **Location**: Choose closest to your users
   - **SSH Keys**: Add your public SSH key
   - **Networking**: Enable IPv4 and IPv6
   - **Firewall**: Create or select existing firewall rules
4. Click **"Create & Buy Now"**

### 1.2 Note Server Details

- **Server IP**: `YOUR_SERVER_IP` (e.g., `123.45.67.89`)
- **Root password**: Save securely (if password auth enabled)

---

## Step 2: Connect to Server via SSH

### 2.1 Initial Connection

```bash
# Connect as root
ssh root@YOUR_SERVER_IP

# Or if using a specific user
ssh -i ~/.ssh/your_key.pem root@YOUR_SERVER_IP
```

### 2.2 Update System

```bash
# Update package list
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git vim ufw fail2ban
```

---

## Step 3: Create Non-Root User

### 3.1 Create Deployment User

```bash
# Create user
adduser mapforge
usermod -aG sudo mapforge

# Switch to new user
su - mapforge

# Create SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

### 3.2 Add Your SSH Key

```bash
# On your local machine, copy your public key
cat ~/.ssh/id_rsa.pub

# On server, add the key
nano ~/.ssh/authorized_keys
# Paste your public key, save and exit

chmod 600 ~/.ssh/authorized_keys
```

### 3.3 Test SSH Access

```bash
# Exit and reconnect as new user
exit
ssh mapforge@YOUR_SERVER_IP
```

---

## Step 4: Install Docker and Docker Compose

### 4.1 Install Docker

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker mapforge

# Verify installation
docker --version
docker compose version

# Log out and back in for group changes to take effect
exit
ssh mapforge@YOUR_SERVER_IP
```

---

## Step 5: Configure Firewall

### 5.1 Set Up UFW Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend API (if exposing directly)
sudo ufw allow 8080/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 6: Clone Repository

### 6.1 Clone MapForge Repository

```bash
# Create application directory
mkdir -p ~/apps
cd ~/apps

# Clone repository
git clone https://github.com/DigitalTwin-Technology/geoappbuilder.git mapforge
cd mapforge

# Verify files
ls -la
```

---

## Step 7: Configure Environment Variables

### 7.1 Create Production Environment File

```bash
# Navigate to project directory
cd ~/mapforge

# Create .env.production file
nano .env.production
```

### 7.2 Add Configuration

**Replace `YOUR_SERVER_IP` with your actual server IP (e.g., `91.98.39.11`)**

```env
# Database Configuration
POSTGRES_DB=mapforge
POSTGRES_USER=mapforge_user
POSTGRES_PASSWORD=mapforge_password_$(openssl rand -hex 8)

# MinIO Configuration
MINIO_ROOT_USER=mapforge_admin
MINIO_ROOT_PASSWORD=mapforge_secret_$(openssl rand -hex 8)

# Backend Configuration
# IMPORTANT: Replace the password in DATABASE_URL with the POSTGRES_PASSWORD above
DATABASE_URL=postgres://mapforge_user:YOUR_POSTGRES_PASSWORD_HERE@postgres:5432/mapforge?sslmode=disable
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=mapforge_admin
MINIO_SECRET_KEY=YOUR_MINIO_PASSWORD_HERE
PORT=8080

# AI Service Configuration
GEMINI_API_KEY=AIzaSyAGBr0HzNexgBMaheJfN62792DGjInVTEc

# Frontend Configuration (build-time)
# Use your server IP or domain
VITE_BACKEND_URL=http://YOUR_SERVER_IP:8080
VITE_AI_SERVICE_URL=http://YOUR_SERVER_IP:8000

# Domain (optional, for SSL setup later)
DOMAIN=yourdomain.com
```

**Example with actual values:**

```env
POSTGRES_DB=mapforge
POSTGRES_USER=mapforge_user
POSTGRES_PASSWORD=mapforge_password_a1b2c3d4

MINIO_ROOT_USER=mapforge_admin
MINIO_ROOT_PASSWORD=mapforge_secret_e5f6g7h8

DATABASE_URL=postgres://mapforge_user:mapforge_password_a1b2c3d4@postgres:5432/mapforge?sslmode=disable
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=mapforge_admin
MINIO_SECRET_KEY=mapforge_secret_e5f6g7h8
PORT=8080

GEMINI_API_KEY=AIzaSyAGBr0HzNexgBMaheJfN62792DGjInVTEc

VITE_BACKEND_URL=http://91.98.39.11:8080
VITE_AI_SERVICE_URL=http://91.98.39.11:8000
```

**Generate Strong Passwords:**

```bash
# Generate random passwords
openssl rand -hex 16

# Or use base64
openssl rand -base64 24
```

**Important Notes:**
- Make sure `DATABASE_URL` uses the same password as `POSTGRES_PASSWORD`
- Make sure `MINIO_SECRET_KEY` matches `MINIO_ROOT_PASSWORD`
- Update `VITE_BACKEND_URL` and `VITE_AI_SERVICE_URL` with your server IP
- Save the file: Ctrl+X, then Y, then Enter

---

## Step 8: Verify Docker Compose File

### 8.1 Check Docker Compose File

The standard `docker-compose.yml` file works for production. You can use it directly:

```bash
# Verify docker-compose.yml exists
ls -la docker-compose.yml

# View the file if needed
cat docker-compose.yml
```

**Note**: The default `docker-compose.yml` is production-ready. You don't need a separate production file unless you want different configurations.

### 8.2 Update Production Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4
    container_name: mapforge-postgres
    restart: always
    env_file:
      - .env.production
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - mapforge-network

  minio:
    image: minio/minio:latest
    container_name: mapforge-minio
    restart: always
    command: server /data --console-address ":9001"
    env_file:
      - .env.production
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - mapforge-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mapforge-backend
    restart: always
    env_file:
      - .env.production
    environment:
      DATABASE_URL: ${DATABASE_URL}
      MINIO_ENDPOINT: ${MINIO_ENDPOINT}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      PORT: ${PORT}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - mapforge-network

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: mapforge-ai-service
    restart: always
    env_file:
      - .env.production
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      PORT: 8000
    networks:
      - mapforge-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_BACKEND_URL: ${VITE_BACKEND_URL}
        VITE_AI_SERVICE_URL: ${VITE_AI_SERVICE_URL}
    container_name: mapforge-frontend
    restart: always
    networks:
      - mapforge-network

volumes:
  postgres_data:
  minio_data:

networks:
  mapforge-network:
    driver: bridge
```

---

## Step 9: Build and Start Services

### 9.1 Build Docker Images

```bash
# Build all services
docker compose -f docker-compose.production.yml --env-file .env.production build

# This may take 5-10 minutes
```

### 9.2 Start Services

```bash
# Start in detached mode
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f
```

### 9.3 Verify Services

```bash
# Check if containers are running
docker ps

# Test backend health
curl http://localhost:8080/api/health

# Test AI service
curl http://localhost:8000/health

# Check frontend (if exposed)
curl http://localhost:5173
```

---

## Step 10: Set Up Nginx Reverse Proxy

### 10.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 10.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/mapforge
```

### 10.3 Add Configuration

**For HTTP-only deployment (initial setup):**

```nginx
# Upstream servers
upstream frontend {
    server localhost:5173;
}

upstream backend {
    server localhost:8080;
}

upstream ai-service {
    server localhost:8000;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ai:10m rate=5r/s;

# HTTP Server
server {
    listen 80;
    listen [::]:80;
    server_name YOUR_SERVER_IP;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # AI Service
    location /ai/ {
        limit_req zone=ai burst=10 nodelay;
        proxy_pass http://ai-service/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**For HTTPS deployment (after SSL setup):**

```nginx
# Upstream servers
upstream frontend {
    server localhost:5173;
}

upstream backend {
    server localhost:8080;
}

upstream ai-service {
    server localhost:8000;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ai:10m rate=5r/s;

# HTTP Server (redirect to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name YOUR_SERVER_IP yourdomain.com;

    # For Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name YOUR_SERVER_IP yourdomain.com;

    # SSL Configuration (after certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # AI Service
    location /ai/ {
        limit_req zone=ai burst=10 nodelay;
        proxy_pass http://ai-service/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.4 Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/mapforge /etc/nginx/sites-enabled/

# Remove default site (if it exists)
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

**Important**: Make sure your Docker containers are running before restarting Nginx:

```bash
# Check containers
docker ps

# If not running, start them:
cd ~/mapforge
docker compose --env-file .env.production up -d

# Wait for services to be ready
sleep 10

# Test services directly
curl http://localhost:8080/api/health
curl http://localhost:8000/health
curl http://localhost:5173
```

---

## Step 11: Set Up SSL Certificate (Let's Encrypt)

### 11.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 11.2 Obtain Certificate

```bash
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS
```

### 11.3 Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot sets up auto-renewal automatically via systemd timer
```

---

## Step 12: Update Frontend Environment Variables

### 12.1 Update Frontend Build Args

Edit `.env.production`:

```env
# Update these to use your domain
VITE_BACKEND_URL=https://yourdomain.com/api
VITE_AI_SERVICE_URL=https://yourdomain.com/ai
```

### 12.2 Rebuild Frontend

```bash
# Rebuild frontend with new URLs
docker compose -f docker-compose.production.yml --env-file .env.production build frontend

# Restart frontend
docker compose -f docker-compose.production.yml --env-file .env.production up -d frontend
```

---

## Step 13: Set Up Monitoring (Optional)

### 13.1 Install Monitoring Tools

```bash
# Install htop for process monitoring
sudo apt install -y htop

# Install netdata for system monitoring (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

### 13.2 Set Up Log Rotation

```bash
# Docker logs are managed automatically
# Check log sizes
docker system df

# Clean up old logs
docker system prune -a --volumes
```

---

## Step 14: Set Up Backups

### 14.1 Create Backup Script

```bash
mkdir -p ~/scripts
nano ~/scripts/backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/mapforge/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/mapforge_${TIMESTAMP}.sql.gz"

mkdir -p $BACKUP_DIR

# Backup database
docker compose -f ~/apps/mapforge/docker-compose.production.yml exec -T postgres pg_dump -U mapforge_user mapforge | gzip > $BACKUP_FILE

# Keep only last 7 backups
find $BACKUP_DIR -name "mapforge_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

### 14.2 Make Executable

```bash
chmod +x ~/scripts/backup.sh
```

### 14.3 Set Up Cron Job

```bash
crontab -e
```

Add:

```cron
# Daily backup at 2 AM
0 2 * * * /home/mapforge/scripts/backup.sh >> /home/mapforge/backups/backup.log 2>&1
```

---

## Step 15: Security Hardening

### 15.1 Configure Fail2Ban

```bash
# Fail2Ban is already installed
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
```

### 15.2 Disable Root Login (Optional)

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Set:
# PermitRootLogin no
# PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

### 15.3 Set Up Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Step 16: Verify Deployment

### 16.1 Test All Endpoints

```bash
# Frontend
curl -I https://yourdomain.com

# Backend health
curl https://yourdomain.com/api/health

# AI service
curl https://yourdomain.com/ai/health
```

### 16.2 Check Container Logs

```bash
# View all logs
docker compose -f docker-compose.production.yml logs

# Follow specific service
docker compose -f docker-compose.production.yml logs -f backend
```

---

## Step 17: Verify Deployment

### 17.1 Final Verification Checklist

```bash
# 1. All containers running
docker ps
# Should show 5 containers: postgres, minio, backend, ai-service, frontend

# 2. Services responding
curl http://localhost:8080/api/health
curl http://localhost:8000/health
curl http://localhost:5173

# 3. Nginx configured and running
sudo systemctl status nginx
sudo nginx -t

# 4. Application accessible via browser
curl http://localhost
# Should return HTML (not Nginx welcome page)

# 5. Firewall allows HTTP/HTTPS
sudo ufw status | grep -E "80|443"
```

### 17.2 Access Application

Open your browser and navigate to:
```
http://YOUR_SERVER_IP
```

You should see the MapForge application interface.

## Step 18: Maintenance Commands

### 18.1 Common Operations

```bash
# Navigate to project directory
cd ~/mapforge

# Stop all services
docker compose down

# Start all services
docker compose --env-file .env.production up -d

# Restart specific service
docker compose restart backend
docker compose restart frontend

# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Update code and redeploy
git pull
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d

# Check resource usage
docker stats

# Clean up unused resources
docker system prune -a

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 18.2 Health Check Script

Create a health check script:

```bash
nano ~/scripts/health-check.sh
```

Add:

```bash
#!/bin/bash
echo "=== MapForge Health Check ==="
echo ""
echo "Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""
echo "Backend Health:"
curl -s http://localhost:8080/api/health | jq . || echo "Backend not responding"
echo ""
echo "AI Service Health:"
curl -s http://localhost:8000/health | jq . || echo "AI Service not responding"
echo ""
echo "Nginx Status:"
sudo systemctl is-active nginx && echo "✓ Running" || echo "✗ Not running"
```

Make executable:
```bash
chmod +x ~/scripts/health-check.sh
```

---

## Troubleshooting

### Issue: Containers Won't Start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs

# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker
```

### Issue: Database Connection Failed

```bash
# Check PostgreSQL logs
docker compose -f docker-compose.production.yml logs postgres

# Test connection
docker compose -f docker-compose.production.yml exec postgres psql -U mapforge_user -d mapforge
```

### Issue: Port Already in Use

```bash
# Find process using port
sudo lsof -i :8080

# Kill process
sudo kill -9 <PID>
```

### Issue: SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

---

## Quick Reference

| Service | Internal Port | External Access |
|---------|--------------|----------------|
| Frontend | 5173 | https://yourdomain.com |
| Backend API | 8080 | https://yourdomain.com/api |
| AI Service | 8000 | https://yourdomain.com/ai |
| PostgreSQL | 5432 | Local only |
| MinIO | 9000, 9001 | Local only (or expose via Nginx) |

---

## Next Steps

1. **Set up domain DNS**: Point A record to your server IP
2. **Configure monitoring**: Set up alerts for service health
3. **Set up CI/CD**: Automate deployments (GitHub Actions, GitLab CI)
4. **Scale horizontally**: Add load balancer for multiple servers
5. **Set up CDN**: Use CloudFlare for static assets

---

## Support

For issues or questions:
- Check logs: `docker compose logs`
- Review documentation: `/docs/` directory
- GitHub Issues: https://github.com/DigitalTwin-Technology/geoappbuilder/issues

