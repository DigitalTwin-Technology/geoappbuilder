-- Enable required PostgreSQL extensions for MapForge
-- This script runs automatically when the container initializes

-- PostGIS: Core spatial functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- PostGIS Raster: Raster data support
CREATE EXTENSION IF NOT EXISTS postgis_raster;

-- pgvector: Vector similarity search for AI embeddings
-- NOTE: Requires pgvector image. Commented out for base PostGIS image.
-- To enable: use pgvector/pgvector:pg16 image or build custom image
-- CREATE EXTENSION IF NOT EXISTS vector;

-- UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search improvements
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extensions are installed
DO $$
BEGIN
    RAISE NOTICE 'PostGIS version: %', PostGIS_Version();
    RAISE NOTICE 'Extensions installed successfully';
END $$;

