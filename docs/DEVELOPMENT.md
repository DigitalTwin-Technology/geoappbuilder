# MapForge Development Guide

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Frontend Development](#frontend-development)
4. [Backend Development](#backend-development)
5. [AI Service Development](#ai-service-development)
6. [Database Management](#database-management)
7. [Testing](#testing)
8. [Code Style & Conventions](#code-style--conventions)
9. [Debugging](#debugging)
10. [Performance Optimization](#performance-optimization)

---

## Development Setup

### Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Docker | 24+ | [docker.com](https://docker.com) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Go | 1.21+ | [go.dev](https://go.dev) |
| Python | 3.11+ | [python.org](https://python.org) |
| pnpm (optional) | 8+ | `npm install -g pnpm` |

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/mapforge.git
cd mapforge

# Start infrastructure (PostgreSQL, MinIO)
docker-compose up -d postgres minio

# Terminal 1: Frontend
cd frontend && npm install && npm run dev

# Terminal 2: Backend
cd backend && go mod download && go run ./cmd/api

# Terminal 3: AI Service
cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
```

### Full Docker Development

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f ai-service

# Rebuild specific service
docker-compose up -d --build frontend
```

---

## Project Structure

```
mapforge/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   ├── stores/           # State management (future: Zustand/Jotai)
│   │   ├── App.tsx           # Root component
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                  # Go API
│   ├── cmd/
│   │   └── api/
│   │       └── main.go       # Entry point
│   ├── internal/
│   │   ├── config/           # Configuration
│   │   ├── handlers/         # HTTP handlers
│   │   ├── middleware/       # HTTP middleware
│   │   ├── models/           # Data models
│   │   ├── repository/       # Database operations
│   │   └── database/         # Database connection
│   ├── pkg/                  # Shared packages
│   ├── go.mod
│   └── go.sum
│
├── ai-service/               # Python FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app
│   │   ├── models/           # Pydantic models
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   ├── tests/                # Test files
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── db/                       # Database
│   ├── init/                 # Initialization scripts
│   └── migrations/           # SQL migrations
│
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEVELOPMENT.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Frontend Development

### Tech Stack

- **React 18**: UI framework with hooks
- **TypeScript**: Strict mode enabled
- **Vite**: Build tool with HMR
- **MapLibre GL JS**: WebGL map rendering
- **Tailwind CSS**: Utility-first styling

### Component Guidelines

#### 1. File Naming
```
ComponentName.tsx       # Component file
ComponentName.test.tsx  # Test file
ComponentName.module.css # CSS modules (if needed)
```

#### 2. Component Structure
```tsx
import { memo, useState, useCallback, useMemo } from 'react';
import type { ComponentProps } from '@/types/app';

interface Props {
  title: string;
  onAction: () => void;
}

/**
 * Component description
 */
export const MyComponent = memo(function MyComponent({ 
  title, 
  onAction 
}: Props) {
  const [state, setState] = useState<string>('');

  // Memoize callbacks that touch map or heavy operations
  const handleClick = useCallback(() => {
    onAction();
  }, [onAction]);

  // Memoize computed values
  const computedValue = useMemo(() => {
    return title.toUpperCase();
  }, [title]);

  return (
    <div className="p-4">
      <h1>{computedValue}</h1>
      <button onClick={handleClick}>Click</button>
    </div>
  );
});
```

#### 3. Map-Related Components

```tsx
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [0, 0],
      zoom: 2,
    });

    mapRef.current = map;

    // IMPORTANT: Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
```

### TypeScript Guidelines

#### No `any` Types
```typescript
// ❌ Bad
const data: any = fetchData();

// ✅ Good
interface FeatureData {
  id: string;
  properties: Record<string, unknown>;
}
const data: FeatureData = fetchData();
```

#### Define All GeoJSON Properties
```typescript
// types/geojson.ts
export interface FeatureProperties {
  name?: string;
  description?: string;
  color?: string;
  [key: string]: unknown; // Allow additional properties
}

export interface AppFeature extends GeoJSON.Feature {
  id: string;
  properties: FeatureProperties;
}
```

### Tailwind CSS Usage

```tsx
// Use utility classes
<div className="flex items-center gap-2 p-4 bg-slate-900 rounded-lg">
  <span className="text-sm font-medium text-white">Label</span>
</div>

// Use CSS variables for themes
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
  Themed content
</div>
```

---

## Backend Development

### Tech Stack

- **Go 1.21**: Language
- **Chi**: HTTP router
- **pgx v5**: PostgreSQL driver
- **Gorilla WebSocket**: WebSocket support

### Code Organization

```go
// cmd/api/main.go - Entry point
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    // Load configuration
    cfg := config.Load()

    // Initialize database
    db, err := database.Connect(cfg.DatabaseURL)
    if err != nil {
        log.Fatalf("failed to connect to database: %v", err)
    }
    defer db.Close()

    // Setup router
    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(60 * time.Second))

    // Mount routes
    r.Mount("/api", routes.API(db))

    // Graceful shutdown
    srv := &http.Server{Addr: ":8080", Handler: r}
    go func() {
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("server error: %v", err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    srv.Shutdown(ctx)
}
```

### Error Handling

```go
// ❌ Bad - No panic
func handler() {
    panic("something went wrong")
}

// ✅ Good - Return errors with context
func processFeature(ctx context.Context, id string) error {
    feature, err := repo.GetFeature(ctx, id)
    if err != nil {
        return fmt.Errorf("failed to get feature %s: %w", id, err)
    }
    
    if err := validate(feature); err != nil {
        return fmt.Errorf("feature %s validation failed: %w", id, err)
    }
    
    return nil
}
```

### Database Queries (PostGIS)

```go
// Use PostGIS functions for all geometry operations
func FindFeaturesWithinRadius(ctx context.Context, db *pgxpool.Pool, point geometry.Point, radiusMeters float64) ([]Feature, error) {
    query := `
        SELECT id, name, ST_AsGeoJSON(geometry) as geojson
        FROM features
        WHERE ST_DWithin(
            geometry,
            ST_SetSRID(ST_Point($1, $2), 4326)::geography,
            $3
        )
    `
    
    rows, err := db.Query(ctx, query, point.Lon, point.Lat, radiusMeters)
    if err != nil {
        return nil, fmt.Errorf("query failed: %w", err)
    }
    defer rows.Close()
    
    // Process rows...
}
```

---

## AI Service Development

### Tech Stack

- **Python 3.11**: Language
- **FastAPI**: Web framework
- **Pydantic**: Data validation
- **google-generativeai**: Gemini API

### Code Organization

```python
# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI(title="MapForge AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class StyleRequest(BaseModel):
    prompt: str
    layer_type: str = "fill"

class StyleResponse(BaseModel):
    style: dict
    explanation: str
    source: str
    timestamp: str

@app.post("/generate-style", response_model=StyleResponse)
async def generate_style(request: StyleRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    # Generate style...
```

### Gemini Integration

```python
import google.generativeai as genai
import os
import json

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")

async def generate_style_with_ai(prompt: str, layer_type: str) -> dict:
    system_prompt = f"""
    You are a MapLibre GL style expert. Generate a valid MapLibre paint style object.
    Layer type: {layer_type}
    
    Valid properties for {layer_type}:
    - fill: fill-color, fill-opacity, fill-outline-color
    - line: line-color, line-width, line-opacity, line-dasharray
    - circle: circle-radius, circle-color, circle-stroke-width
    
    Return ONLY valid JSON, no markdown or explanation.
    """
    
    try:
        response = model.generate_content(f"{system_prompt}\n\nPrompt: {prompt}")
        text = response.text.strip()
        
        # Parse JSON from response
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        
        return json.loads(text)
    except Exception as e:
        # Fallback to keyword-based parsing
        return fallback_style_generator(prompt, layer_type)
```

### Fallback Style Generator

```python
def fallback_style_generator(prompt: str, layer_type: str) -> dict:
    """Keyword-based fallback when AI is unavailable."""
    prompt_lower = prompt.lower()
    style = {}
    
    # Color mapping
    colors = {
        "red": "#ef4444",
        "blue": "#3b82f6",
        "green": "#22c55e",
        "orange": "#f97316",
        "purple": "#8b5cf6",
    }
    
    for color_name, color_value in colors.items():
        if color_name in prompt_lower:
            if layer_type == "fill":
                style["fill-color"] = color_value
            elif layer_type == "line":
                style["line-color"] = color_value
            elif layer_type == "circle":
                style["circle-color"] = color_value
            break
    
    # Opacity
    import re
    opacity_match = re.search(r'(\d+)%', prompt)
    if opacity_match:
        opacity = int(opacity_match.group(1)) / 100
        style[f"{layer_type}-opacity"] = opacity
    
    # Line width
    if "thick" in prompt_lower:
        style["line-width"] = 5
    elif "thin" in prompt_lower:
        style["line-width"] = 1
    
    return style
```

---

## Database Management

### Running Migrations

```bash
# Using golang-migrate
migrate -path db/migrations -database "postgres://user:pass@localhost:5432/mapforge?sslmode=disable" up

# Rollback
migrate -path db/migrations -database "..." down 1
```

### Creating New Migration

```bash
migrate create -ext sql -dir db/migrations -seq add_users_table
```

This creates:
```
db/migrations/
├── 000002_add_users_table.up.sql
└── 000002_add_users_table.down.sql
```

### PostGIS Best Practices

```sql
-- Always use GIST index for geometry columns
CREATE INDEX idx_features_geometry ON features USING GIST (geometry);

-- Use geography type for distance calculations
SELECT * FROM features
WHERE ST_DWithin(geometry::geography, ST_Point(6.96, 50.93)::geography, 1000);

-- Prefer server-side geometry operations
SELECT 
    id,
    ST_Area(geometry::geography) as area_m2,
    ST_Centroid(geometry) as centroid
FROM features;
```

---

## Testing

### Frontend Testing

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

```tsx
// MapComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MapComponent } from './MapComponent';

describe('MapComponent', () => {
  it('renders map container', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});
```

### Backend Testing

```bash
cd backend

# Run tests
go test ./...

# With coverage
go test -cover ./...

# Verbose
go test -v ./...
```

```go
// handlers/health_test.go
package handlers_test

import (
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/stretchr/testify/assert"
)

func TestHealthHandler(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
    rec := httptest.NewRecorder()
    
    handler := handlers.HealthHandler(db)
    handler.ServeHTTP(rec, req)
    
    assert.Equal(t, http.StatusOK, rec.Code)
}
```

### AI Service Testing

```bash
cd ai-service

# Run tests
pytest

# With coverage
pytest --cov=app

# Verbose
pytest -v
```

```python
# tests/test_style_generator.py
import pytest
from app.main import fallback_style_generator

def test_fallback_extracts_color():
    result = fallback_style_generator("bright blue lines", "line")
    assert result["line-color"] == "#3b82f6"

def test_fallback_extracts_opacity():
    result = fallback_style_generator("red with 50% transparency", "fill")
    assert result["fill-opacity"] == 0.5
```

---

## Code Style & Conventions

### TypeScript/React

- Use `memo` for components that receive callbacks/objects as props
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive computations
- Prefer named exports over default exports
- Use absolute imports (`@/components/...`)

### Go

- Follow [Effective Go](https://go.dev/doc/effective_go)
- Use `context.Context` for cancellation/timeout
- Wrap errors with `fmt.Errorf("message: %w", err)`
- No `panic()` except in truly unrecoverable situations

### Python

- Follow PEP 8
- Use type hints for all function signatures
- Use Pydantic for request/response validation
- Prefer async functions for I/O operations

---

## Debugging

### Frontend Debugging

```tsx
// Enable MapLibre debug mode
const map = new maplibregl.Map({
  // ...
  transformRequest: (url, type) => {
    console.log('[Map Request]', type, url);
    return { url };
  }
});

// Debug layer paint properties
console.log(map.getPaintProperty('layer-id', 'fill-color'));
```

### Backend Debugging

```go
// Add request ID middleware
r.Use(func(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := uuid.New().String()
        ctx := context.WithValue(r.Context(), "requestID", requestID)
        log.Printf("[%s] %s %s", requestID, r.Method, r.URL.Path)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
})
```

### AI Service Debugging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.post("/generate-style")
async def generate_style(request: StyleRequest):
    logger.debug(f"Received prompt: {request.prompt}")
    # ...
```

---

## Performance Optimization

### Frontend

1. **Virtualize large lists**: Use `react-virtual` for layer/feature lists
2. **Lazy load components**: Use `React.lazy` for panels
3. **Debounce map events**: Throttle `moveend` handlers
4. **Use WebWorkers**: Offload heavy GeoJSON processing

### Backend

1. **Connection pooling**: Use `pgxpool` with appropriate limits
2. **Spatial indexes**: Ensure GIST indexes on all geometry columns
3. **Prepared statements**: Use `pgx` prepared statement cache
4. **Pagination**: Always paginate large result sets

### Database

1. **Analyze queries**: Use `EXPLAIN ANALYZE` for slow queries
2. **Partition tables**: Consider partitioning by project/region
3. **Simplify geometries**: Use `ST_Simplify` for display
4. **Cache tiles**: Generate and cache vector tiles

---

## Environment Variables

### Required

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `GEMINI_API_KEY` | AI Service | Google Gemini API key |

### Optional

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `PORT` | Backend | 8080 | HTTP server port |
| `LOG_LEVEL` | All | info | Logging level |
| `CORS_ORIGINS` | Backend/AI | localhost:5173 | Allowed CORS origins |

---

## Useful Commands

```bash
# Start everything
docker-compose up -d

# View all logs
docker-compose logs -f

# Rebuild and restart a service
docker-compose up -d --build backend

# Stop everything
docker-compose down

# Remove all data (volumes)
docker-compose down -v

# Connect to PostgreSQL
docker-compose exec postgres psql -U mapforge_user -d mapforge

# Run PostGIS query
docker-compose exec postgres psql -U mapforge_user -d mapforge -c "SELECT PostGIS_Version();"
```

