package config

import (
	"os"
)

// Config holds application configuration
type Config struct {
	Port           string
	DatabaseURL    string
	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	AIServiceURL   string
}

// Load reads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://mapforge:mapforge_secret@localhost:5432/mapforge?sslmode=disable"),
		MinioEndpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey: getEnv("MINIO_ACCESS_KEY", "mapforge_admin"),
		MinioSecretKey: getEnv("MINIO_SECRET_KEY", "mapforge_secret_key"),
		AIServiceURL:   getEnv("AI_SERVICE_URL", "http://localhost:8000"),
	}
}

// getEnv retrieves an environment variable with a default fallback
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

