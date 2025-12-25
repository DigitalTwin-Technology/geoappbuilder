# MapForge Troubleshooting Guide

## Application Not Accessible in Browser

### Step 1: Check if Services are Running

```bash
# Check Docker containers status
docker ps

# Should show all containers running:
# - mapforge-postgres
# - mapforge-minio
# - mapforge-backend
# - mapforge-ai-service
# - mapforge-frontend

# Check specific service logs
docker logs mapforge-backend
docker logs mapforge-frontend
docker logs mapforge-ai-service
```

### Step 2: Check Port Accessibility

```bash
# Check if ports are listening
sudo netstat -tlnp | grep -E "5173|8080|8000|80|443"

# Or using ss
sudo ss -tlnp | grep -E "5173|8080|8000|80|443"

# Should show:
# :80 (Nginx)
# :443 (Nginx)
# :5173 (Frontend - if exposed directly)
# :8080 (Backend - if exposed directly)
# :8000 (AI Service - if exposed directly)
```

### Step 3: Check Firewall Rules

```bash
# Check UFW status
sudo ufw status

# Should allow:
# 22/tcp (SSH)
# 80/tcp (HTTP)
# 443/tcp (HTTPS)

# Check Hetzner Cloud Firewall (via console)
# Ensure ports 80 and 443 are open
```

### Step 4: Check Nginx Status

```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Step 5: Test Services Directly

```bash
# Test backend (should work locally)
curl http://localhost:8080/api/health

# Test AI service
curl http://localhost:8000/health

# Test frontend (if exposed)
curl http://localhost:5173

# Test Nginx
curl http://localhost
curl https://localhost
```

### Step 6: Check Docker Compose Status

```bash
# Navigate to project directory
cd ~/apps/mapforge

# Check compose status
docker compose -f docker-compose.production.yml ps

# Check logs
docker compose -f docker-compose.production.yml logs --tail=50
```

### Step 7: Verify Network Configuration

```bash
# Check if containers can communicate
docker network inspect mapforge_mapforge-network

# Test connectivity between containers
docker exec mapforge-backend ping -c 2 postgres
docker exec mapforge-backend ping -c 2 minio
```

### Step 8: Check Environment Variables

```bash
# Verify .env.production exists and has correct values
cat .env.production

# Check if variables are loaded
docker exec mapforge-backend env | grep DATABASE_URL
docker exec mapforge-frontend env | grep VITE
```

---

## Common Issues and Solutions

### Issue 1: Containers Not Running

**Symptoms**: `docker ps` shows no containers or containers are stopped

**Solution**:
```bash
cd ~/apps/mapforge
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Check logs for errors
docker compose -f docker-compose.production.yml logs
```

### Issue 2: Port Already in Use

**Symptoms**: Error "port is already allocated" or "address already in use"

**Solution**:
```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :8080

# Kill process or change port in docker-compose.yml
```

### Issue 3: Nginx Not Running

**Symptoms**: `systemctl status nginx` shows inactive

**Solution**:
```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check configuration
sudo nginx -t

# Restart if config changed
sudo systemctl restart nginx
```

### Issue 4: Nginx Configuration Error

**Symptoms**: `nginx -t` fails or 502 Bad Gateway

**Solution**:
```bash
# Check Nginx config
sudo nano /etc/nginx/sites-available/mapforge

# Verify upstream servers are correct:
# - frontend: localhost:5173
# - backend: localhost:8080
# - ai-service: localhost:8000

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Issue 5: Frontend Not Built

**Symptoms**: Frontend container running but no content

**Solution**:
```bash
# Rebuild frontend
cd ~/apps/mapforge
docker compose -f docker-compose.production.yml --env-file .env.production build frontend
docker compose -f docker-compose.production.yml --env-file .env.production up -d frontend

# Check frontend logs
docker logs mapforge-frontend
```

### Issue 6: Database Connection Failed

**Symptoms**: Backend logs show database connection errors

**Solution**:
```bash
# Check database is running
docker ps | grep postgres

# Test database connection
docker exec mapforge-postgres psql -U mapforge_user -d mapforge -c "SELECT 1;"

# Check DATABASE_URL in .env.production
grep DATABASE_URL .env.production

# Verify network connectivity
docker exec mapforge-backend ping postgres
```

### Issue 7: SSL Certificate Issues

**Symptoms**: HTTPS not working, certificate errors

**Solution**:
```bash
# Check certificate exists
sudo ls -la /etc/letsencrypt/live/

# Renew certificate
sudo certbot renew

# Check Nginx SSL config
sudo grep -A 5 "ssl_certificate" /etc/nginx/sites-available/mapforge
```

### Issue 8: Firewall Blocking Traffic

**Symptoms**: Can't access from browser, but works locally

**Solution**:
```bash
# Check UFW
sudo ufw status

# Allow HTTP/HTTPS if not already
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check Hetzner Cloud Firewall (via console)
# Ensure inbound rules allow ports 80 and 443
```

### Issue 9: Wrong Domain/IP Configuration

**Symptoms**: Application loads but API calls fail

**Solution**:
```bash
# Check frontend environment variables
docker exec mapforge-frontend env | grep VITE

# Should show:
# VITE_BACKEND_URL=https://yourdomain.com/api (or http://YOUR_IP:8080)
# VITE_AI_SERVICE_URL=https://yourdomain.com/ai (or http://YOUR_IP:8000)

# If wrong, update .env.production and rebuild frontend
```

### Issue 10: CORS Errors in Browser

**Symptoms**: Browser console shows CORS errors

**Solution**:
```bash
# Check backend CORS configuration
# Ensure frontend URL is in allowed origins

# Check AI service CORS
docker exec mapforge-ai-service env | grep CORS
```

---

## Quick Diagnostic Script

Run this script on your server to diagnose issues:

```bash
#!/bin/bash
echo "=== MapForge Diagnostic ==="
echo ""

echo "1. Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "2. Ports Listening:"
sudo ss -tlnp | grep -E "80|443|8080|8000|5173" || echo "No ports found"
echo ""

echo "3. Nginx Status:"
sudo systemctl status nginx --no-pager | head -5
echo ""

echo "4. Service Health Checks:"
echo "Backend:"
curl -s http://localhost:8080/api/health || echo "Backend not responding"
echo ""
echo "AI Service:"
curl -s http://localhost:8000/health || echo "AI Service not responding"
echo ""

echo "5. Nginx Configuration Test:"
sudo nginx -t
echo ""

echo "6. Firewall Status:"
sudo ufw status
echo ""

echo "7. Recent Nginx Errors:"
sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No errors"
echo ""

echo "8. Docker Compose Status:"
cd ~/apps/mapforge 2>/dev/null && docker compose -f docker-compose.production.yml ps || echo "Not in project directory"
```

---

## Step-by-Step Recovery

If nothing is working, follow these steps:

### 1. Stop Everything

```bash
cd ~/apps/mapforge
docker compose -f docker-compose.production.yml down
sudo systemctl stop nginx
```

### 2. Check Prerequisites

```bash
# Docker running?
sudo systemctl status docker

# Disk space?
df -h

# Memory?
free -h
```

### 3. Start Services One by One

```bash
# Start database first
docker compose -f docker-compose.production.yml --env-file .env.production up -d postgres

# Wait 10 seconds
sleep 10

# Start backend
docker compose -f docker-compose.production.yml --env-file .env.production up -d backend

# Wait 5 seconds
sleep 5

# Start AI service
docker compose -f docker-compose.production.yml --env-file .env.production up -d ai-service

# Start frontend
docker compose -f docker-compose.production.yml --env-file .env.production up -d frontend

# Start Nginx
sudo systemctl start nginx
```

### 4. Verify Each Service

```bash
# Database
docker logs mapforge-postgres --tail=20

# Backend
curl http://localhost:8080/api/health

# AI Service
curl http://localhost:8000/health

# Frontend
curl http://localhost:5173

# Nginx
curl http://localhost
```

---

## Testing from Browser

### Test HTTP

```bash
# From your local machine
curl http://YOUR_SERVER_IP

# Should return HTML from frontend
```

### Test HTTPS

```bash
# If you have domain
curl https://yourdomain.com

# Should return HTML and valid SSL certificate
```

### Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for errors:
   - Network errors (404, 502, 503)
   - CORS errors
   - Connection refused
   - SSL certificate errors

---

## Still Not Working?

1. **Check server logs**: `docker compose logs` and `sudo tail -f /var/log/nginx/error.log`
2. **Verify IP/Domain**: Ensure you're accessing the correct IP or domain
3. **Check DNS**: If using domain, verify DNS points to server IP
4. **Test locally**: Try accessing `http://localhost` on the server itself
5. **Check Hetzner Console**: Verify server is running and not suspended

