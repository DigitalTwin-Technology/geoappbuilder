package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps the pgx connection pool with convenience methods
type DB struct {
	Pool *pgxpool.Pool
}

// New creates a new database connection
func New(ctx context.Context, databaseURL string) (*DB, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	// Configure pool settings
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{Pool: pool}, nil
}

// Close closes the database connection pool
func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

// Ping checks database connectivity
func (db *DB) Ping(ctx context.Context) error {
	return db.Pool.Ping(ctx)
}

// PostGISVersion returns the PostGIS version string
func (db *DB) PostGISVersion(ctx context.Context) (string, error) {
	var version string
	err := db.Pool.QueryRow(ctx, "SELECT PostGIS_Version()").Scan(&version)
	if err != nil {
		return "", fmt.Errorf("failed to get PostGIS version: %w", err)
	}
	return version, nil
}

