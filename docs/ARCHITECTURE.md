# MapForge - Software Architecture

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Service Components](#service-components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [API Specifications](#api-specifications)
8. [Frontend Architecture](#frontend-architecture)
9. [Security Considerations](#security-considerations)
10. [Deployment Architecture](#deployment-architecture)
11. [Scalability Considerations](#scalability-considerations)

---

## Overview

MapForge is a collaborative mapping platform that enables real-time collaborative editing of geospatial data with AI-powered styling capabilities.

### Key Features

- **Real-time Collaboration**: Multiple users can edit map data simultaneously using CRDTs (Yjs)
- **Heavy Rendering**: WebGL-based rendering capable of handling 100k+ vector points via MapLibre GL JS
- **PostGIS Backend**: All geospatial calculations handled server-side by PostGIS
- **AI Integration**: Text-to-Style generation using Google Gemini API
- **S3-Compatible Storage**: MinIO for storing large user-uploaded files (GeoJSON/KML)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTS                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Browser   │  │   Browser   │  │   Browser   │  │   Browser   │         │
│  │  (React +   │  │  (React +   │  │  (React +   │  │  (React +   │         │
│  │  MapLibre)  │  │  MapLibre)  │  │  MapLibre)  │  │  MapLibre)  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                │                 │
│         └────────────────┴────────────────┴────────────────┘                 │
│                                   │                                          │
│                    ┌──────────────┴──────────────┐                           │
│                    │      WebSocket (Yjs)        │                           │
│                    │    Real-time Sync Layer     │                           │
│                    └──────────────┬──────────────┘                           │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │        Load Balancer        │
                    │      (Nginx / Traefik)      │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│   Frontend    │        │   Backend     │        │  AI Service   │
│   (Vite +     │        │   (Go API)    │        │  (FastAPI)    │
│    React)     │        │               │        │               │
│   Port: 5173  │        │  Port: 8080   │        │  Port: 8000   │
└───────────────┘        └───────┬───────┘        └───────┬───────┘
                                 │                        │
                    ┌────────────┴────────────┐           │
                    │                         │           │
                    ▼                         ▼           │
           ┌───────────────┐        ┌───────────────┐     │
           │  PostgreSQL   │        │    MinIO      │     │
           │   + PostGIS   │        │  (S3 Storage) │     │
           │   Port: 5432  │        │  Port: 9000   │     │
           └───────────────┘        └───────────────┘     │
                                                          │
                                          ┌───────────────┴───────┐
                                          │   Google Gemini API   │
                                          │   (External Service)  │
                                          └───────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool & Dev Server |
| MapLibre GL JS | 4.x | WebGL Map Rendering |
| Tailwind CSS | 3.x | Utility-First Styling |
| Yjs | 13.x | CRDT for Real-time Collaboration |

### Backend (API)
| Technology | Version | Purpose |
|------------|---------|---------|
| Go | 1.21+ | API Language |
| Chi Router | 5.x | HTTP Router |
| pgx | 5.x | PostgreSQL Driver |
| Gorilla WebSocket | 1.x | WebSocket Support |

### AI Service
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.115.x | API Framework |
| google-generativeai | 0.8.x | Gemini API Client |
| Pydantic | 2.x | Data Validation |

### Database & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 16+ | Primary Database |
| PostGIS | 3.4+ | Geospatial Extension |
| pgvector | - | Vector Similarity (Optional) |
| MinIO | Latest | S3-Compatible Object Storage |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local Orchestration |
| Nginx/Traefik | Reverse Proxy & Load Balancing |

---

## Service Components

### 1. Frontend Service (`/frontend`)

**Responsibility**: User interface and map rendering

```
frontend/
├── src/
│   ├── components/
│   │   ├── MapComponent.tsx      # MapLibre GL JS integration
│   │   ├── MapErrorBoundary.tsx  # WebGL error handling
│   │   ├── Header.tsx            # App header with project info
│   │   ├── Sidebar.tsx           # Layers, Data, Style panels
│   │   ├── Toolbar.tsx           # Drawing tools
│   │   ├── SearchBar.tsx         # Location search
│   │   ├── PropertiesPanel.tsx   # Feature properties editor
│   │   └── CollaboratorPresence.tsx # Real-time user presence
│   ├── types/
│   │   ├── app.ts                # Application types
│   │   └── geojson.ts            # GeoJSON type definitions
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles + Tailwind
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

**Key Design Decisions**:
- Uses `useMemo` and `useCallback` for performance optimization on map-related operations
- Error Boundaries wrap the Map component to prevent WebGL crashes from breaking the UI
- Map instance is cleaned up properly on unmount (`map.remove()`)
- Controlled components for all form inputs

### 2. Backend Service (`/backend`)

**Responsibility**: REST API, WebSocket hub, database operations

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go            # Environment configuration
│   ├── handlers/
│   │   └── health.go            # Health check endpoint
│   └── database/
│       └── database.go          # PostgreSQL connection pool
├── go.mod
├── go.sum
└── Dockerfile
```

**Key Design Decisions**:
- Uses `pgx` for native prepared statements and connection pooling
- Explicit error handling (no `panic()`)
- Context-based request cancellation
- Chi router for lightweight HTTP routing

### 3. AI Service (`/ai-service`)

**Responsibility**: Text-to-SQL and Text-to-Style generation

```
ai-service/
├── app/
│   ├── __init__.py
│   └── main.py                  # FastAPI application
├── requirements.txt
└── Dockerfile
```

**Key Design Decisions**:
- Stateless design: receives prompt, returns SQL/JSON
- Fallback mechanism for rate limiting
- Keyword-based style generation as backup

**API Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/generate-sql` | POST | Generate PostGIS SQL from natural language |
| `/generate-style` | POST | Generate MapLibre style from description |

### 4. Database (`/db`)

**Responsibility**: Persistent data storage with geospatial capabilities

```
db/
├── init/
│   └── 01-extensions.sql        # Enable PostGIS, uuid-ossp
└── migrations/
    ├── 000001_init_schema.up.sql
    └── 000001_init_schema.down.sql
```

**Extensions Enabled**:
- `postgis` - Geometry types and functions
- `postgis_raster` - Raster data support
- `uuid-ossp` - UUID generation
- `vector` (optional) - pgvector for AI embeddings

---

## Data Flow

### 1. Map Rendering Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│  Frontend   │───▶│   Backend   │───▶│  PostGIS    │
│  Action     │    │ (MapLibre)  │    │   (Go API)  │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                                      │
                          │◀────────────────────────────────────┘
                          │         GeoJSON Response
                          ▼
                   ┌─────────────┐
                   │   WebGL     │
                   │  Rendering  │
                   └─────────────┘
```

### 2. AI Style Generation Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│  Frontend   │───▶│ AI Service  │───▶│   Gemini    │
│  Prompt     │    │  Sidebar    │    │  (FastAPI)  │    │    API      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                                      │
                          │◀────────────────────────────────────┘
                          │         Style JSON
                          ▼
                   ┌─────────────┐
                   │  MapLibre   │
                   │ setPaint()  │
                   └─────────────┘
```

### 3. Real-time Collaboration Flow (Future)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User A    │───▶│   Yjs       │───▶│  WebSocket  │───▶│   User B    │
│  Edit       │    │   CRDT      │    │    Hub      │    │  Receives   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Database Schema

### Core Tables (Initial Migration)

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Layers table
CREATE TABLE layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(50) NOT NULL,
    style JSONB DEFAULT '{}',
    visibility BOOLEAN DEFAULT TRUE,
    z_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Features table (with PostGIS geometry)
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
    geometry GEOMETRY NOT NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index for performance
CREATE INDEX idx_features_geometry ON features USING GIST (geometry);

-- Project collaborators
CREATE TABLE project_collaborators (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    PRIMARY KEY (project_id, user_id)
);
```

---

## API Specifications

### Backend API (Go - Port 8080)

#### Health Check
```http
GET /api/health

Response 200:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

#### Layers (Future)
```http
GET /api/projects/:projectId/layers
POST /api/projects/:projectId/layers
GET /api/projects/:projectId/layers/:layerId
PUT /api/projects/:projectId/layers/:layerId
DELETE /api/projects/:projectId/layers/:layerId
```

#### Features (Future)
```http
GET /api/layers/:layerId/features
POST /api/layers/:layerId/features
GET /api/layers/:layerId/features/:featureId
PUT /api/layers/:layerId/features/:featureId
DELETE /api/layers/:layerId/features/:featureId
```

### AI Service API (Python - Port 8000)

#### Health Check
```http
GET /health

Response 200:
{
  "status": "healthy",
  "service": "ai-service",
  "version": "0.2.0"
}
```

#### Generate SQL
```http
POST /generate-sql
Content-Type: application/json

Request:
{
  "prompt": "Find all parks within 500m of the city center",
  "context": "parks table with geometry column"
}

Response 200:
{
  "sql": "SELECT * FROM parks WHERE ST_DWithin(geometry, ST_SetSRID(ST_Point(6.9603, 50.9375), 4326)::geography, 500)",
  "explanation": "Finds parks within 500 meters of the specified point",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

#### Generate Style
```http
POST /generate-style
Content-Type: application/json

Request:
{
  "prompt": "bright blue thick lines",
  "layer_type": "line"
}

Response 200:
{
  "style": {
    "line-color": "#3b82f6",
    "line-width": 5,
    "line-opacity": 0.8
  },
  "explanation": "Line style with bright blue color and thick width",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── ProjectName
│   └── UserActions (Share, Export, Settings)
├── Sidebar
│   ├── TabNavigation (Layers, Data, Style)
│   ├── LayersPanel
│   │   └── LayerItem[]
│   ├── DataPanel
│   │   └── DataSourceItem[]
│   └── StylePanel
│       ├── BasemapSelector
│       └── AIStyleGenerator
├── MainContent
│   ├── SearchBar
│   ├── CollaboratorPresence
│   ├── Toolbar
│   │   └── ToolButton[]
│   ├── MapErrorBoundary
│   │   └── MapComponent
│   └── ZoomIndicator
└── PropertiesPanel
    └── PropertyEditor[]
```

### State Management

```typescript
// App-level state
interface AppState {
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  activeTool: DrawingTool;
  selectedFeature: Feature | null;
  layers: Layer[];
  mapInstance: MapLibreMap | null;
}

// Drawing tools
type DrawingTool = 
  | 'select' 
  | 'pan' 
  | 'point' 
  | 'line' 
  | 'polygon' 
  | 'rectangle' 
  | 'circle' 
  | 'text' 
  | 'measure';

// Layer structure
interface Layer {
  id: string;
  name: string;
  type: 'vector' | 'raster';
  visible: boolean;
  locked: boolean;
  color: string;
}

// Feature structure
interface Feature {
  id: string;
  layerId: string;
  type: 'Point' | 'LineString' | 'Polygon';
  properties: FeatureProperties;
  coordinates: number[] | number[][] | number[][][];
}
```

---

## Security Considerations

### 1. API Security
- CORS configuration restricts origins
- Rate limiting on AI endpoints (Gemini quota)
- Input validation with Pydantic (Python) and struct tags (Go)

### 2. Database Security
- Parameterized queries (no SQL injection)
- Connection pooling with limited max connections
- PostGIS functions used instead of client-side geometry math

### 3. Frontend Security
- No sensitive data in localStorage
- WebGL context loss handling
- Error boundaries prevent information leakage

### 4. Infrastructure Security
- Docker network isolation
- Environment variables for secrets
- Non-root container users (production)

---

## Deployment Architecture

### Development (Docker Compose)

```yaml
services:
  postgres:    # PostGIS database
  minio:       # S3-compatible storage
  backend:     # Go API
  ai-service:  # Python FastAPI
  frontend:    # Vite dev server
```

### Production (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CDN (CloudFlare)                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Frontend    │       │   Backend     │       │  AI Service   │
│  (Nginx +     │       │   (Go API)    │       │  (FastAPI)    │
│  Static)      │       │   Replicas    │       │  Replicas     │
└───────────────┘       └───────┬───────┘       └───────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
        ┌───────────────┐               ┌───────────────┐
        │   PostgreSQL  │               │     MinIO     │
        │   (RDS/Cloud) │               │   (S3/Cloud)  │
        └───────────────┘               └───────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

1. **Backend API**: Stateless, can be replicated behind load balancer
2. **AI Service**: Stateless, scale based on request volume
3. **WebSocket Hub**: Requires sticky sessions or Redis pub/sub

### Vertical Scaling

1. **PostgreSQL**: Increase RAM for query caching
2. **PostGIS**: Heavy geometry operations benefit from more CPU

### Caching Strategy

1. **Tile Caching**: Cache generated vector tiles at CDN
2. **Query Caching**: Redis for frequently accessed spatial queries
3. **Style Caching**: Cache AI-generated styles by prompt hash

### Database Optimization

1. **Spatial Indexes**: GIST indexes on all geometry columns
2. **Partitioning**: Partition large feature tables by project/region
3. **Read Replicas**: Separate read traffic for analytics

---

## Future Enhancements

1. **Real-time Collaboration**: Implement Yjs WebSocket provider
2. **Vector Tiles**: Generate and serve MVT tiles for large datasets
3. **Authentication**: OAuth2 with Google/GitHub providers
4. **Export**: Support for GeoJSON, KML, Shapefile exports
5. **Version History**: Track changes to features over time
6. **Comments**: Allow users to comment on specific features
7. **Mobile Support**: Responsive design for tablet/mobile

---

## References

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Yjs Documentation](https://docs.yjs.dev/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Chi Router](https://go-chi.io/)
- [FastAPI](https://fastapi.tiangolo.com/)

