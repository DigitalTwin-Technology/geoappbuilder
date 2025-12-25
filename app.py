"""
GeoAppBuilder - AI-Powered Spatial Intelligence Platform
A modern web application with MCP-style GIS capabilities.

Run with: uvicorn app:app --reload
"""

import json
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from shapely.geometry import Point, mapping, shape, LineString
from shapely.ops import transform
from pyproj import Transformer, Geod

# Initialize FastAPI app
app = FastAPI(
    title="GeoAppBuilder",
    description="AI-Powered Spatial Intelligence Platform with MCP capabilities",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
WGS84 = "EPSG:4326"
WEB_MERCATOR = "EPSG:3857"

# Geodesic calculator for accurate Earth distances
geod = Geod(ellps="WGS84")


# ============================================
# Pydantic Models
# ============================================
class DangerZoneRequest(BaseModel):
    """Request model for creating a danger zone."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude of center point")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude of center point")
    radius_km: float = Field(..., gt=0, le=1000, description="Radius in kilometers")
    name: Optional[str] = Field(default="Danger Zone", description="Name for the zone")


class DangerZoneResponse(BaseModel):
    """Response model for danger zone."""
    success: bool
    name: str
    center: dict
    radius_km: float
    area_sq_km: float
    perimeter_km: float
    geojson: dict


class DistanceRequest(BaseModel):
    """Request model for distance calculation."""
    point1: dict = Field(..., description="First point {lat, lon}")
    point2: dict = Field(..., description="Second point {lat, lon}")


class DistanceResponse(BaseModel):
    """Response model for distance calculation."""
    success: bool
    distance_km: float
    distance_miles: float
    bearing: float


class GeocodeRequest(BaseModel):
    """Request for geocoding (placeholder)."""
    address: str


class PointInPolygonRequest(BaseModel):
    """Check if a point is inside a polygon."""
    point: dict = Field(..., description="Point {lat, lon}")
    polygon: dict = Field(..., description="GeoJSON polygon")


class BufferMultipleRequest(BaseModel):
    """Create buffers around multiple points."""
    points: List[dict] = Field(..., description="List of {lat, lon, radius_km} objects")


# ============================================
# Helper Functions
# ============================================
def _create_transformer(from_crs: str, to_crs: str) -> Transformer:
    """Create a pyproj transformer between two CRS."""
    return Transformer.from_crs(from_crs, to_crs, always_xy=True)


def _calculate_geodesic_area(geometry) -> float:
    """Calculate geodesic area in square kilometers."""
    # Use pyproj's Geod for accurate area calculation
    poly_area, _ = geod.geometry_area_perimeter(geometry)
    return abs(poly_area) / 1_000_000  # Convert m² to km²


def _calculate_geodesic_perimeter(geometry) -> float:
    """Calculate geodesic perimeter in kilometers."""
    _, perimeter = geod.geometry_area_perimeter(geometry)
    return abs(perimeter) / 1000  # Convert m to km


# ============================================
# API Endpoints
# ============================================
@app.post("/api/danger-zone", response_model=DangerZoneResponse)
async def create_danger_zone(request: DangerZoneRequest):
    """
    Create a circular danger zone buffer around a point.
    
    This is the core spatial analysis tool - creates a precise circular buffer
    using geodesic calculations for accuracy at any location on Earth.
    """
    try:
        radius_meters = request.radius_km * 1000
        
        # Create point and transformers
        point_wgs84 = Point(request.longitude, request.latitude)
        to_metric = _create_transformer(WGS84, WEB_MERCATOR)
        to_wgs84 = _create_transformer(WEB_MERCATOR, WGS84)
        
        # Project, buffer, project back
        point_metric = transform(to_metric.transform, point_wgs84)
        buffer_metric = point_metric.buffer(radius_meters, resolution=64)
        buffer_wgs84 = transform(to_wgs84.transform, buffer_metric)
        
        # Calculate metrics using geodesic calculations
        area_sq_km = _calculate_geodesic_area(buffer_wgs84)
        perimeter_km = _calculate_geodesic_perimeter(buffer_wgs84)
        
        # Build GeoJSON Feature
        geojson_feature = {
            "type": "Feature",
            "properties": {
                "name": request.name,
                "type": "danger_zone",
                "radius_km": request.radius_km,
                "area_sq_km": round(area_sq_km, 2),
                "perimeter_km": round(perimeter_km, 2),
                "center": {"lat": request.latitude, "lon": request.longitude}
            },
            "geometry": mapping(buffer_wgs84)
        }
        
        return DangerZoneResponse(
            success=True,
            name=request.name,
            center={"lat": request.latitude, "lon": request.longitude},
            radius_km=request.radius_km,
            area_sq_km=round(area_sq_km, 2),
            perimeter_km=round(perimeter_km, 2),
            geojson=geojson_feature
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/distance", response_model=DistanceResponse)
async def calculate_distance(request: DistanceRequest):
    """
    Calculate the geodesic distance between two points.
    
    Uses the WGS84 ellipsoid for accurate Earth distance calculations.
    Also returns the forward bearing from point1 to point2.
    """
    try:
        lon1, lat1 = request.point1["lon"], request.point1["lat"]
        lon2, lat2 = request.point2["lon"], request.point2["lat"]
        
        # Calculate geodesic distance and bearing
        bearing, _, distance_m = geod.inv(lon1, lat1, lon2, lat2)
        
        distance_km = distance_m / 1000
        distance_miles = distance_km * 0.621371
        
        # Normalize bearing to 0-360
        bearing = (bearing + 360) % 360
        
        return DistanceResponse(
            success=True,
            distance_km=round(distance_km, 2),
            distance_miles=round(distance_miles, 2),
            bearing=round(bearing, 1)
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/point-in-polygon")
async def check_point_in_polygon(request: PointInPolygonRequest):
    """
    Check if a point is inside a polygon.
    
    Useful for determining if a location falls within a danger zone or region.
    """
    try:
        point = Point(request.point["lon"], request.point["lat"])
        polygon = shape(request.polygon)
        
        is_inside = polygon.contains(point)
        distance_to_boundary = point.distance(polygon.boundary) if not is_inside else 0
        
        return {
            "success": True,
            "is_inside": is_inside,
            "distance_to_boundary_degrees": round(distance_to_boundary, 6)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/buffer-multiple")
async def create_multiple_buffers(request: BufferMultipleRequest):
    """
    Create buffer zones around multiple points at once.
    
    Returns a GeoJSON FeatureCollection with all buffers.
    """
    try:
        features = []
        to_metric = _create_transformer(WGS84, WEB_MERCATOR)
        to_wgs84 = _create_transformer(WEB_MERCATOR, WGS84)
        
        for i, pt in enumerate(request.points):
            point_wgs84 = Point(pt["lon"], pt["lat"])
            radius_m = pt.get("radius_km", 1) * 1000
            
            point_metric = transform(to_metric.transform, point_wgs84)
            buffer_metric = point_metric.buffer(radius_m, resolution=32)
            buffer_wgs84 = transform(to_wgs84.transform, buffer_metric)
            
            features.append({
                "type": "Feature",
                "properties": {
                    "index": i,
                    "radius_km": pt.get("radius_km", 1),
                    "center": {"lat": pt["lat"], "lon": pt["lon"]}
                },
                "geometry": mapping(buffer_wgs84)
            })
        
        return {
            "success": True,
            "count": len(features),
            "geojson": {
                "type": "FeatureCollection",
                "features": features
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/tools")
async def list_available_tools():
    """
    List all available GIS tools (MCP-style endpoint).
    
    This endpoint describes the capabilities exposed by this server,
    following MCP conventions for tool discovery.
    """
    return {
        "tools": [
            {
                "name": "calculate_danger_zone",
                "description": "Create a circular buffer zone around a geographic point. Useful for defining exclusion zones, safety perimeters, or analysis areas.",
                "parameters": {
                    "latitude": "float: Center point latitude (-90 to 90)",
                    "longitude": "float: Center point longitude (-180 to 180)", 
                    "radius_km": "float: Buffer radius in kilometers",
                    "name": "string: Optional name for the zone"
                }
            },
            {
                "name": "calculate_distance",
                "description": "Calculate the geodesic distance between two points on Earth using WGS84 ellipsoid.",
                "parameters": {
                    "point1": "{lat, lon}: First point coordinates",
                    "point2": "{lat, lon}: Second point coordinates"
                }
            },
            {
                "name": "point_in_polygon",
                "description": "Check if a point falls within a polygon boundary.",
                "parameters": {
                    "point": "{lat, lon}: Point to check",
                    "polygon": "GeoJSON polygon geometry"
                }
            },
            {
                "name": "buffer_multiple",
                "description": "Create buffer zones around multiple points at once.",
                "parameters": {
                    "points": "Array of {lat, lon, radius_km} objects"
                }
            }
        ],
        "version": "2.0.0",
        "protocol": "MCP-compatible"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "operational",
        "service": "GeoAppBuilder",
        "version": "2.0.0",
        "capabilities": ["buffer", "distance", "point-in-polygon", "multi-buffer"]
    }


# ============================================
# Static Files & Frontend
# ============================================
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """Serve the main application."""
    return FileResponse("static/index.html")
