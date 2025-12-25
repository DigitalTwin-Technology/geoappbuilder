# Infrastructure Configuration

This directory contains infrastructure configuration files for MapForge.

## Contents

```
infra/
├── docker/                     # Docker configurations
│   ├── backend.Dockerfile      # Production backend Dockerfile
│   ├── frontend.Dockerfile     # Production frontend Dockerfile
│   └── ai-service.Dockerfile   # Production AI service Dockerfile
├── nginx/                      # Nginx configuration
│   ├── nginx.conf              # Main Nginx configuration
│   └── ssl/                    # SSL certificates (gitignored)
├── kubernetes/                 # Kubernetes manifests (future)
│   ├── deployments/
│   ├── services/
│   └── configmaps/
├── terraform/                  # Terraform IaC (future)
│   ├── aws/
│   └── gcp/
└── scripts/                    # Deployment scripts
    ├── backup.sh
    ├── restore.sh
    └── deploy.sh
```

## Quick Start

### Development

```bash
# Start all services
cd .. && docker-compose up -d

# View logs
docker-compose logs -f
```

### Production

See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for full production deployment guide.

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `POSTGRES_PASSWORD` | Database password |
| `MINIO_ROOT_PASSWORD` | MinIO admin password |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Backend port |
| `LOG_LEVEL` | info | Logging level |

## Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL + PostGIS |
| `minio` | 9000, 9001 | S3-compatible storage |
| `backend` | 8080 | Go REST API |
| `ai-service` | 8000 | Python FastAPI |
| `frontend` | 5173 | Vite dev server |

## Resource Requirements

### Minimum (Development)
- 2 CPU cores
- 4 GB RAM
- 20 GB storage

### Recommended (Production)
- 4+ CPU cores
- 8+ GB RAM
- 100+ GB SSD storage
- Dedicated PostgreSQL instance

## Monitoring

For production monitoring, we recommend:

1. **Prometheus** - Metrics collection
2. **Grafana** - Dashboards
3. **Loki** - Log aggregation
4. **AlertManager** - Alerting

See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for setup instructions.
