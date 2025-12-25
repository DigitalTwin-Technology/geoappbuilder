# MapForge Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Docker Deployment](#docker-deployment)
3. [Production Configuration](#production-configuration)
4. [Cloud Deployment](#cloud-deployment)
5. [Monitoring & Logging](#monitoring--logging)
6. [Backup & Recovery](#backup--recovery)
7. [Security Hardening](#security-hardening)
8. [Troubleshooting](#troubleshooting)

---

## Overview

MapForge can be deployed in various configurations:

| Environment | Recommended Approach |
|-------------|---------------------|
| Development | Docker Compose (local) |
| Staging | Docker Compose (remote) or Kubernetes |
| Production | Kubernetes or managed services |

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB SSD | 100+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

---

## Docker Deployment

### Single Server Deployment

#### 1. Prerequisites

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose v2
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

#### 2. Clone and Configure

```bash
git clone https://github.com/yourusername/mapforge.git
cd mapforge

# Create production environment file
cp .env.example .env.production
nano .env.production
```

#### 3. Production Environment Variables

```env
# Database
POSTGRES_DB=mapforge
POSTGRES_USER=mapforge_user
POSTGRES_PASSWORD=<STRONG_PASSWORD_HERE>

# MinIO
MINIO_ROOT_USER=minio_admin
MINIO_ROOT_PASSWORD=<STRONG_PASSWORD_HERE>

# AI Service
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>

# Backend
DATABASE_URL=postgres://mapforge_user:<PASSWORD>@postgres:5432/mapforge?sslmode=disable

# Frontend (build-time)
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_AI_SERVICE_URL=https://ai.yourdomain.com
```

#### 4. Production Docker Compose

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4
    restart: always
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
      - internal

  minio:
    image: minio/minio
    restart: always
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - internal

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal
      - web

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    restart: always
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    networks:
      - internal
      - web

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
      args:
        VITE_BACKEND_URL: ${VITE_BACKEND_URL}
        VITE_AI_SERVICE_URL: ${VITE_AI_SERVICE_URL}
    restart: always
    networks:
      - web

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot
    depends_on:
      - frontend
      - backend
      - ai-service
    networks:
      - web

volumes:
  postgres_data:
  minio_data:
  certbot_data:

networks:
  internal:
  web:
```

#### 5. Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream backend {
        server backend:8080;
    }

    upstream ai-service {
        server ai-service:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=ai:10m rate=5r/s;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Main domain
    server {
        listen 80;
        listen 443 ssl;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # API subdomain
    server {
        listen 80;
        listen 443 ssl;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
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
    }

    # AI Service subdomain
    server {
        listen 80;
        listen 443 ssl;
        server_name ai.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            limit_req zone=ai burst=10 nodelay;
            proxy_pass http://ai-service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 6. Production Dockerfile for Frontend

Create `frontend/Dockerfile.production`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG VITE_BACKEND_URL
ARG VITE_AI_SERVICE_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_AI_SERVICE_URL=$VITE_AI_SERVICE_URL

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 7. Deploy

```bash
# Build and start
docker-compose -f docker-compose.production.yml --env-file .env.production up -d --build

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## Production Configuration

### SSL Certificates with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com -d ai.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/

# Auto-renewal (crontab)
0 0 * * * certbot renew --quiet && docker-compose -f docker-compose.production.yml restart nginx
```

### Database Optimization

```sql
-- PostgreSQL configuration (postgresql.conf)
-- Add to docker-compose volume mount

shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
max_parallel_maintenance_workers = 2
```

---

## Cloud Deployment

### AWS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Route 53                               │
│                    (DNS + Health Checks)                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                        CloudFront                               │
│                    (CDN + SSL Termination)                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                   Application Load Balancer                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│     ECS       │       │     ECS       │       │     ECS       │
│   Frontend    │       │    Backend    │       │  AI Service   │
│  (Fargate)    │       │   (Fargate)   │       │  (Fargate)    │
└───────────────┘       └───────┬───────┘       └───────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
        ┌───────────────┐               ┌───────────────┐
        │     RDS       │               │      S3       │
        │  (PostgreSQL  │               │   (Storage)   │
        │   + PostGIS)  │               │               │
        └───────────────┘               └───────────────┘
```

### Terraform Configuration (Example)

```hcl
# main.tf
provider "aws" {
  region = "eu-central-1"
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "mapforge-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["eu-central-1a", "eu-central-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = true
}

# RDS PostgreSQL with PostGIS
resource "aws_db_instance" "postgres" {
  identifier           = "mapforge-db"
  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t3.medium"
  allocated_storage    = 100
  
  db_name  = "mapforge"
  username = "mapforge_user"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.default.name
  
  backup_retention_period = 7
  multi_az               = true
  
  # Enable PostGIS
  parameter_group_name = aws_db_parameter_group.postgres.name
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "mapforge-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

### Google Cloud Platform

```yaml
# Cloud Run deployment
# backend-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: mapforge-backend
spec:
  template:
    spec:
      containers:
        - image: gcr.io/YOUR_PROJECT/mapforge-backend
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
          resources:
            limits:
              cpu: "2"
              memory: "1Gi"
```

---

## Monitoring & Logging

### Prometheus + Grafana Stack

Add to `docker-compose.production.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - internal

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - internal
      - web

  loki:
    image: grafana/loki
    volumes:
      - loki_data:/loki
    networks:
      - internal

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
```

### Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: /metrics

  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:8000']
    metrics_path: /metrics
```

### Go Backend Metrics

```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
)

func init() {
    prometheus.MustRegister(httpRequestsTotal)
}

// In router
r.Handle("/metrics", promhttp.Handler())
```

---

## Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/mapforge_${TIMESTAMP}.sql.gz"

# Create backup
docker-compose exec -T postgres pg_dump -U mapforge_user mapforge | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://mapforge-backups/database/

# Keep only last 7 local backups
find $BACKUP_DIR -name "mapforge_*.sql.gz" -mtime +7 -delete
```

### Restore Database

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

# Download from S3 if needed
if [[ $BACKUP_FILE == s3://* ]]; then
    aws s3 cp $BACKUP_FILE /tmp/restore.sql.gz
    BACKUP_FILE="/tmp/restore.sql.gz"
fi

# Restore
gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U mapforge_user -d mapforge
```

### Cron Jobs

```bash
# /etc/cron.d/mapforge-backup
0 2 * * * root /opt/mapforge/backup.sh >> /var/log/mapforge-backup.log 2>&1
```

---

## Security Hardening

### Docker Security

```yaml
# Add to service definitions
services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    user: "1000:1000"
```

### Network Security

```yaml
# Firewall rules (ufw)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Secret Management

```bash
# Using Docker secrets
echo "db_password_here" | docker secret create db_password -
```

```yaml
# docker-compose.production.yml
services:
  backend:
    secrets:
      - db_password

secrets:
  db_password:
    external: true
```

---

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check logs
docker-compose logs <service>

# Check resource usage
docker stats

# Inspect container
docker inspect <container_id>
```

#### 2. Database Connection Failed

```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Check connection from backend
docker-compose exec backend sh -c "nc -zv postgres 5432"

# View database logs
docker-compose logs postgres
```

#### 3. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout | grep -A2 "Validity"

# Test SSL
openssl s_client -connect yourdomain.com:443
```

#### 4. Performance Issues

```bash
# Check slow queries (PostgreSQL)
docker-compose exec postgres psql -U mapforge_user -d mapforge -c "
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"

# Check container resource usage
docker stats --no-stream
```

### Health Checks

```bash
# All services
curl http://localhost:8080/api/health
curl http://localhost:8000/health
curl http://localhost/

# Database
docker-compose exec postgres pg_isready -U mapforge_user -d mapforge
```

---

## Maintenance

### Updates

```bash
# Pull latest images
docker-compose -f docker-compose.production.yml pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# Clean up old images
docker image prune -a -f
```

### Rolling Updates (Zero Downtime)

```bash
# Scale up new version
docker-compose -f docker-compose.production.yml up -d --scale backend=2 --no-recreate

# Health check
sleep 30
curl -f http://localhost:8080/api/health || exit 1

# Remove old container
docker-compose -f docker-compose.production.yml up -d --scale backend=1
```

---

## Checklist

### Pre-Deployment

- [ ] Strong passwords set for all services
- [ ] SSL certificates configured
- [ ] Firewall rules applied
- [ ] Backup system configured
- [ ] Monitoring setup complete
- [ ] Environment variables verified

### Post-Deployment

- [ ] All health checks passing
- [ ] SSL certificate valid
- [ ] Backups running successfully
- [ ] Monitoring alerts configured
- [ ] Documentation updated

