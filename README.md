# MapForge - Collaborative Mapping Platform

<p align="center">
  <img src="docs/images/mapforge-logo.svg" alt="MapForge Logo" width="200"/>
</p>

<p align="center">
  <strong>A collaborative mapping platform with AI-powered styling</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#development">Development</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## Overview

MapForge is an open-source collaborative mapping platform that enables teams to create, edit, and share maps in real-time with AI-powered styling capabilities.

### Key Capabilities

- 🗺️ **Interactive WebGL Maps**: Powered by MapLibre GL JS for smooth 60fps rendering
- 🎨 **AI Style Generator**: Natural language to map styles using Google Gemini
- 🌍 **PostGIS Backend**: Enterprise-grade geospatial database operations
- 👥 **Real-time Collaboration**: CRDT-based sync for simultaneous editing (roadmap)
- 📦 **S3-Compatible Storage**: MinIO for large file uploads (GeoJSON, KML, Shapefiles)

---

## Features

### Current Features (v0.2.0)

| Feature | Description |
|---------|-------------|
| **Interactive Map** | Full-screen MapLibre GL JS map with zoom/pan controls |
| **Layer Management** | Sidebar with layer visibility toggles |
| **Drawing Tools** | Toolbar with point, line, polygon, rectangle, circle tools |
| **AI Style Generator** | Generate and apply MapLibre styles from natural language |
| **Demo Data** | Pre-loaded tectonic plate boundaries and Cologne landmarks |
| **Basemap Selector** | Light, Dark, Satellite, Streets basemap options |
| **Properties Panel** | Edit feature properties |
| **Search Bar** | Location search placeholder |
| **Collaborator Presence** | UI for showing active collaborators |

### Roadmap

- [ ] Real-time collaboration with Yjs
- [ ] User authentication (OAuth2)
- [ ] Project creation and sharing
- [ ] File upload (GeoJSON, KML, Shapefile)
- [ ] Export functionality
- [ ] Version history
- [ ] Comments on features
- [ ] Mobile responsive design

---

## Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (v2.0+)
- **Node.js** 18+ (for local frontend development)
- **Go** 1.21+ (for local backend development)
- **Python** 3.11+ (for local AI service development)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mapforge.git
cd mapforge
```

### 2. Start All Services (Docker)

```bash
# Start all services in containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main application |
| **Backend API** | http://localhost:8080/api/health | Go REST API |
| **AI Service** | http://localhost:8000/health | Python FastAPI |
| **MinIO Console** | http://localhost:9001 | S3 storage admin |

### 4. Stop All Services

```bash
docker-compose down
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   MapLibre  │  │   Sidebar   │  │   Toolbar   │                  │
│  │   GL JS     │  │  (Layers,   │  │  (Drawing   │                  │
│  │   (WebGL)   │  │  Styles)    │  │   Tools)    │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┴────────────────┴────────────────┴─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API Gateway                                 │
│           REST (HTTP) + WebSocket (Real-time Sync)                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│    Backend    │       │  AI Service   │       │    MinIO      │
│   (Go + Chi)  │       │  (FastAPI)    │       │ (S3 Storage)  │
│               │       │               │       │               │
│   REST API    │       │ Text-to-SQL   │       │ File Uploads  │
│   WebSocket   │       │ Text-to-Style │       │               │
└───────┬───────┘       └───────┬───────┘       └───────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│  PostgreSQL   │       │    Gemini     │
│   + PostGIS   │       │     API       │
│               │       │  (External)   │
│ Geospatial DB │       │               │
└───────────────┘       └───────────────┘
```

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Project Structure

```
mapforge/
├── frontend/                    # React + Vite + MapLibre
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── MapComponent.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ...
│   │   ├── types/               # TypeScript types
│   │   ├── App.tsx              # Main app
│   │   └── main.tsx             # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/                     # Go API + WebSocket
│   ├── cmd/
│   │   └── api/
│   │       └── main.go          # Entry point
│   ├── internal/
│   │   ├── config/              # Configuration
│   │   ├── handlers/            # HTTP handlers
│   │   └── database/            # Database connection
│   ├── go.mod
│   └── Dockerfile
│
├── ai-service/                  # Python FastAPI
│   ├── app/
│   │   └── main.py              # FastAPI app with Gemini integration
│   ├── requirements.txt
│   └── Dockerfile
│
├── db/                          # Database scripts
│   ├── init/
│   │   └── 01-extensions.sql    # PostGIS extension setup
│   └── migrations/
│       ├── 000001_init_schema.up.sql
│       └── 000001_init_schema.down.sql
│
├── infra/                       # Infrastructure configs
│   └── README.md
│
├── docs/                        # Documentation
│   └── ARCHITECTURE.md          # Detailed architecture
│
├── docker-compose.yml           # Local development setup
├── .gitignore
└── README.md                    # This file
```

---

## Development

### Local Development (Recommended)

For faster development with hot-reload:

#### 1. Start Database Services

```bash
# Start only PostgreSQL and MinIO
docker-compose up -d postgres minio
```

#### 2. Run Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

#### 3. Run Backend

```bash
cd backend
go mod download
go run ./cmd/api
# → http://localhost:8080
```

#### 4. Run AI Service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgres://mapforge_user:mapforge_password@localhost:5432/mapforge?sslmode=disable

# AI Service
GEMINI_API_KEY=your-gemini-api-key

# MinIO
MINIO_ROOT_USER=mapforge_admin
MINIO_ROOT_PASSWORD=mapforge_secret_key

# Frontend (Vite)
VITE_BACKEND_URL=http://localhost:8080
VITE_AI_SERVICE_URL=http://localhost:8000
```

---

## API Reference

### Backend API (Go)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |

### AI Service API (Python)

#### Health Check
```http
GET /health
```

#### Generate Style
```http
POST /generate-style
Content-Type: application/json

{
  "prompt": "bright blue with thick dashed lines",
  "layer_type": "line"
}
```

Response:
```json
{
  "style": {
    "line-color": "#3b82f6",
    "line-width": 5,
    "line-dasharray": [4, 2]
  },
  "explanation": "Blue color with thick dashed line style",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

#### Generate SQL
```http
POST /generate-sql
Content-Type: application/json

{
  "prompt": "Find all buildings within 1km of the point",
  "context": "buildings table with geometry column"
}
```

Response:
```json
{
  "sql": "SELECT * FROM buildings WHERE ST_DWithin(geometry, ST_SetSRID(ST_Point(6.9603, 50.9375), 4326)::geography, 1000)",
  "explanation": "Uses ST_DWithin for radius search",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

---

## Configuration

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | `postgis/postgis:16-3.4` | 5432 | PostgreSQL + PostGIS |
| `minio` | `minio/minio` | 9000, 9001 | S3-compatible storage |
| `backend` | Custom (Go) | 8080 | REST API |
| `ai-service` | Custom (Python) | 8000 | AI endpoints |
| `frontend` | Custom (Vite) | 5173 | React app |

### Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | `mapforge_user` | `mapforge_password` |
| MinIO | `mapforge_admin` | `mapforge_secret_key` |

⚠️ **Change these in production!**

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **MapLibre GL JS** - WebGL map rendering
- **Tailwind CSS** - Utility-first styling

### Backend
- **Go 1.21** - API language
- **Chi** - HTTP router
- **pgx v5** - PostgreSQL driver

### AI Service
- **Python 3.11** - Runtime
- **FastAPI** - API framework
- **Google Generative AI** - Gemini integration

### Database
- **PostgreSQL 16** - Primary database
- **PostGIS 3.4** - Geospatial extension

### Infrastructure
- **Docker** - Containerization
- **MinIO** - Object storage

---

## Demo Data

The application comes pre-loaded with:

### 1. Tectonic Plate Boundaries
- **Red lines**: Divergent boundaries (Mid-Atlantic Ridge, East African Rift)
- **Orange lines**: Convergent boundaries (Pacific Ring of Fire, Alps)

### 2. Cologne, Germany Landmarks
- 🔴 Kölner Dom (Cologne Cathedral)
- 🔴 Hohenzollern Bridge
- 🔵 Chocolate Museum
- 🔵 Old Town (Altstadt)
- 🟢 RheinEnergieStadion

---

## AI Style Generator Usage

The AI Style Generator allows you to style map layers using natural language:

### Example Prompts

| Prompt | Layer Type | Result |
|--------|------------|--------|
| "bright blue thick lines" | Line | Blue lines, width 5 |
| "red fill with 50% transparency" | Fill | Red fill, 0.5 opacity |
| "large green circles with white border" | Circle | Green circles, white stroke |
| "sunset orange gradient" | Fill | Orange fill with warm tones |

### How It Works

1. Select a **Target Layer** from the dropdown
2. Enter a **style description** in natural language
3. Click **Generate & Apply**
4. The style is applied directly to the map

If the Gemini API rate limit is hit, a fallback keyword-based parser generates the style.

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

#### Docker Container Won't Start
```bash
# Remove and recreate containers
docker-compose down -v
docker-compose up -d --build
```

#### PostgreSQL Extension Error
The `vector` extension is optional. If it fails to install, the database will still work.

#### Gemini API Quota Exceeded
The AI service has a fallback keyword parser. If you see "Rate limit" errors, the fallback will handle style generation.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- **Frontend**: Strict TypeScript, no `any` types
- **Backend**: Go error handling (no `panic()`), wrap errors with context
- **Database**: Use PostGIS functions for all geometry operations
- **Components**: Memoize with `useMemo`/`useCallback` for map operations

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [MapLibre](https://maplibre.org) - Open-source mapping library
- [PostGIS](https://postgis.net) - Geospatial database extension
- [Google Gemini](https://ai.google.dev) - AI language model

---

<p align="center">
  Made with ❤️ for the geospatial community
</p>
