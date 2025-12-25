# MapForge API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Backend API (Go)](#backend-api-go)
4. [AI Service API (Python)](#ai-service-api-python)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Overview

MapForge exposes two API services:

| Service | Base URL | Language | Purpose |
|---------|----------|----------|---------|
| **Backend API** | `http://localhost:8080/api` | Go | Core CRUD operations, WebSocket |
| **AI Service** | `http://localhost:8000` | Python | AI-powered SQL and style generation |

---

## Authentication

> **Note**: Authentication is not yet implemented. All endpoints are currently public.

### Future Implementation

```http
Authorization: Bearer <jwt-token>
```

---

## Backend API (Go)

Base URL: `http://localhost:8080/api`

### Health Check

Check if the backend service is running and connected to the database.

```http
GET /api/health
```

**Response 200 OK**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

**Response 503 Service Unavailable**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "connection refused",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

---

### Projects (Planned)

#### List Projects

```http
GET /api/projects
```

**Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |
| `sort` | string | `created_at` | Sort field |
| `order` | string | `desc` | Sort order (`asc` or `desc`) |

**Response 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Project",
      "description": "A mapping project",
      "owner_id": "uuid",
      "is_public": false,
      "created_at": "2025-12-25T00:00:00Z",
      "updated_at": "2025-12-25T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

#### Create Project

```http
POST /api/projects
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "My Project",
  "description": "A mapping project",
  "is_public": false
}
```

**Response 201 Created**
```json
{
  "id": "uuid",
  "name": "My Project",
  "description": "A mapping project",
  "owner_id": "uuid",
  "is_public": false,
  "created_at": "2025-12-25T00:00:00Z",
  "updated_at": "2025-12-25T00:00:00Z"
}
```

#### Get Project

```http
GET /api/projects/:id
```

**Response 200 OK**
```json
{
  "id": "uuid",
  "name": "My Project",
  "description": "A mapping project",
  "owner_id": "uuid",
  "is_public": false,
  "layers": [],
  "collaborators": [],
  "created_at": "2025-12-25T00:00:00Z",
  "updated_at": "2025-12-25T00:00:00Z"
}
```

#### Update Project

```http
PUT /api/projects/:id
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response 200 OK**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "description": "Updated description",
  "updated_at": "2025-12-25T00:00:00Z"
}
```

#### Delete Project

```http
DELETE /api/projects/:id
```

**Response 204 No Content**

---

### Layers (Planned)

#### List Layers

```http
GET /api/projects/:projectId/layers
```

**Response 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "name": "Buildings",
      "layer_type": "vector",
      "style": {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.5
      },
      "visibility": true,
      "z_index": 0,
      "created_at": "2025-12-25T00:00:00Z"
    }
  ]
}
```

#### Create Layer

```http
POST /api/projects/:projectId/layers
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "Buildings",
  "layer_type": "vector",
  "style": {
    "fill-color": "#3b82f6",
    "fill-opacity": 0.5
  }
}
```

**Response 201 Created**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "Buildings",
  "layer_type": "vector",
  "created_at": "2025-12-25T00:00:00Z"
}
```

---

### Features (Planned)

#### List Features in Layer

```http
GET /api/layers/:layerId/features
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `bbox` | string | Bounding box filter: `minLon,minLat,maxLon,maxLat` |
| `limit` | integer | Maximum features to return |

**Response 200 OK**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "uuid",
      "properties": {
        "name": "Building A",
        "height": 50
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[6.96, 50.93], [6.97, 50.93], [6.97, 50.94], [6.96, 50.94], [6.96, 50.93]]]
      }
    }
  ]
}
```

#### Create Feature

```http
POST /api/layers/:layerId/features
Content-Type: application/json
```

**Request Body**
```json
{
  "type": "Feature",
  "properties": {
    "name": "Building A",
    "height": 50
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[6.96, 50.93], [6.97, 50.93], [6.97, 50.94], [6.96, 50.94], [6.96, 50.93]]]
  }
}
```

**Response 201 Created**
```json
{
  "type": "Feature",
  "id": "uuid",
  "properties": {
    "name": "Building A",
    "height": 50
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[6.96, 50.93], [6.97, 50.93], [6.97, 50.94], [6.96, 50.94], [6.96, 50.93]]]
  }
}
```

#### Spatial Query

```http
POST /api/layers/:layerId/features/query
Content-Type: application/json
```

**Request Body**
```json
{
  "operation": "within",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[6.95, 50.92], [6.98, 50.92], [6.98, 50.95], [6.95, 50.95], [6.95, 50.92]]]
  }
}
```

**Supported Operations**
| Operation | Description |
|-----------|-------------|
| `within` | Features completely within the query geometry |
| `intersects` | Features that intersect the query geometry |
| `contains` | Features that contain the query geometry |
| `dwithin` | Features within a distance (requires `distance` parameter in meters) |

**Response 200 OK**
```json
{
  "type": "FeatureCollection",
  "features": [...]
}
```

---

## AI Service API (Python)

Base URL: `http://localhost:8000`

### Health Check

```http
GET /health
```

**Response 200 OK**
```json
{
  "status": "healthy",
  "service": "ai-service",
  "version": "0.2.0",
  "gemini_model": "gemini-2.0-flash",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

---

### Generate Style

Convert natural language descriptions to MapLibre GL style properties.

```http
POST /generate-style
Content-Type: application/json
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Natural language style description |
| `layer_type` | string | No | MapLibre layer type: `fill`, `line`, `circle`, `symbol` (default: `fill`) |

**Example Request**
```json
{
  "prompt": "bright blue with 50% transparency and white border",
  "layer_type": "fill"
}
```

**Response 200 OK**
```json
{
  "style": {
    "fill-color": "#3b82f6",
    "fill-opacity": 0.5,
    "fill-outline-color": "#ffffff"
  },
  "explanation": "Blue fill with 50% opacity and white border",
  "source": "gemini",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

**Style Properties by Layer Type**

| Layer Type | Available Properties |
|------------|---------------------|
| `fill` | `fill-color`, `fill-opacity`, `fill-outline-color`, `fill-pattern` |
| `line` | `line-color`, `line-width`, `line-opacity`, `line-blur`, `line-dasharray`, `line-cap`, `line-join` |
| `circle` | `circle-radius`, `circle-color`, `circle-blur`, `circle-opacity`, `circle-stroke-width`, `circle-stroke-color` |
| `symbol` | `icon-color`, `icon-size`, `text-color`, `text-size`, `text-halo-color`, `text-halo-width` |

**Fallback Behavior**

If the Gemini API is unavailable or rate-limited, the service uses a keyword-based fallback:

```json
{
  "style": {
    "fill-color": "#3b82f6",
    "fill-opacity": 0.5
  },
  "explanation": "Fallback: Parsed 'blue' color and '50%' opacity from prompt",
  "source": "fallback",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

**Recognized Keywords (Fallback)**

| Keyword | Property | Value |
|---------|----------|-------|
| `red` | color | `#ef4444` |
| `blue` | color | `#3b82f6` |
| `green` | color | `#22c55e` |
| `orange` | color | `#f97316` |
| `purple` | color | `#8b5cf6` |
| `yellow` | color | `#eab308` |
| `white` | color | `#ffffff` |
| `black` | color | `#1f2937` |
| `50%`, `0.5` | opacity | `0.5` |
| `thick` | line-width | `5` |
| `thin` | line-width | `1` |
| `dashed` | line-dasharray | `[4, 2]` |
| `dotted` | line-dasharray | `[1, 2]` |

---

### Generate SQL

Convert natural language queries to PostGIS SQL.

```http
POST /generate-sql
Content-Type: application/json
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Natural language query description |
| `context` | string | No | Additional context about the schema |

**Example Request**
```json
{
  "prompt": "Find all parks within 500 meters of the city center",
  "context": "parks table with name, geometry columns"
}
```

**Response 200 OK**
```json
{
  "sql": "SELECT name, geometry FROM parks WHERE ST_DWithin(geometry, ST_SetSRID(ST_Point(6.9603, 50.9375), 4326)::geography, 500)",
  "explanation": "Uses ST_DWithin for radius search in meters. Geography type enables accurate distance calculation.",
  "source": "gemini",
  "timestamp": "2025-12-25T00:00:00Z"
}
```

**PostGIS Functions Used**

| Function | Description |
|----------|-------------|
| `ST_DWithin(g1, g2, distance)` | True if geometries are within specified distance |
| `ST_Intersects(g1, g2)` | True if geometries intersect |
| `ST_Contains(g1, g2)` | True if g1 contains g2 |
| `ST_Within(g1, g2)` | True if g1 is within g2 |
| `ST_Buffer(g, distance)` | Returns geometry buffered by distance |
| `ST_Area(g)` | Returns area of geometry |
| `ST_Length(g)` | Returns length of geometry |
| `ST_Centroid(g)` | Returns centroid point |
| `ST_Transform(g, srid)` | Transforms to different coordinate system |

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Prompt cannot be empty",
    "details": {
      "field": "prompt",
      "constraint": "required"
    }
  },
  "timestamp": "2025-12-25T00:00:00Z"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `204` | No Content (successful delete) |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `422` | Unprocessable Entity |
| `429` | Too Many Requests (rate limit) |
| `500` | Internal Server Error |
| `503` | Service Unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Permission denied |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `AI_SERVICE_ERROR` | AI service failed |
| `DATABASE_ERROR` | Database operation failed |

---

## Rate Limiting

### AI Service Limits

The AI service is subject to Google Gemini API rate limits:

| Plan | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 15 | 1,500 |
| Paid | Based on quota | Based on quota |

When rate limited, the service returns:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Gemini API quota exceeded. Using fallback style generator.",
    "retry_after": 60
  }
}
```

The fallback style generator is used automatically when rate limits are hit.

---

## WebSocket API (Planned)

### Connection

```
ws://localhost:8080/ws/projects/:projectId
```

### Message Types

#### Client → Server

```json
{
  "type": "feature:update",
  "payload": {
    "feature_id": "uuid",
    "changes": {
      "properties": { "name": "Updated Name" }
    }
  }
}
```

#### Server → Client

```json
{
  "type": "feature:updated",
  "payload": {
    "feature_id": "uuid",
    "updated_by": "user-uuid",
    "changes": {
      "properties": { "name": "Updated Name" }
    },
    "timestamp": "2025-12-25T00:00:00Z"
  }
}
```

### Presence Events

```json
{
  "type": "presence:join",
  "payload": {
    "user_id": "uuid",
    "name": "Alice",
    "color": "#3b82f6",
    "cursor": { "lng": 6.96, "lat": 50.93 }
  }
}
```

---

## CORS Configuration

### Allowed Origins

```
http://localhost:5173
http://localhost:3000
```

### Allowed Methods

```
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Allowed Headers

```
Content-Type, Authorization, X-Request-ID
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// AI Style Generation
const response = await fetch('http://localhost:8000/generate-style', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'bright blue with thick lines',
    layer_type: 'line'
  })
});

const { style } = await response.json();

// Apply to MapLibre
map.setPaintProperty('my-layer', 'line-color', style['line-color']);
map.setPaintProperty('my-layer', 'line-width', style['line-width']);
```

### Python

```python
import httpx

async def generate_style(prompt: str, layer_type: str = 'fill'):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'http://localhost:8000/generate-style',
            json={'prompt': prompt, 'layer_type': layer_type}
        )
        return response.json()

# Usage
style = await generate_style('ocean blue with white border', 'fill')
print(style['style'])  # {'fill-color': '#0ea5e9', 'fill-outline-color': '#ffffff'}
```

### cURL

```bash
# Generate style
curl -X POST http://localhost:8000/generate-style \
  -H "Content-Type: application/json" \
  -d '{"prompt": "forest green thick lines", "layer_type": "line"}'

# Generate SQL
curl -X POST http://localhost:8000/generate-sql \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Find buildings taller than 100m", "context": "buildings table with height column"}'
```

