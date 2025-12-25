-- Rollback migration: 000001_init_schema

-- Drop triggers first
DROP TRIGGER IF EXISTS update_features_updated_at ON features;
DROP TRIGGER IF EXISTS update_layers_updated_at ON layers;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order of creation (respecting foreign keys)
DROP TABLE IF EXISTS uploaded_files;
DROP TABLE IF EXISTS project_collaborators;
DROP TABLE IF EXISTS features;
DROP TABLE IF EXISTS layers;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

