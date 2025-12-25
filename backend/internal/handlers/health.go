package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// HealthHandler handles health check requests
type HealthHandler struct {
	db *pgxpool.Pool
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Services  map[string]string `json:"services"`
	Version   string            `json:"version"`
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{db: db}
}

// Check handles GET /api/health requests
func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Services:  make(map[string]string),
		Version:   "0.1.0",
	}

	// Check database connection
	if err := h.checkDatabase(ctx); err != nil {
		response.Status = "degraded"
		response.Services["postgres"] = "unhealthy: " + err.Error()
	} else {
		response.Services["postgres"] = "healthy"
	}

	// Check PostGIS extension
	if err := h.checkPostGIS(ctx); err != nil {
		response.Services["postgis"] = "unhealthy: " + err.Error()
	} else {
		response.Services["postgis"] = "healthy"
	}

	// Set response status code
	statusCode := http.StatusOK
	if response.Status != "healthy" {
		statusCode = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

// checkDatabase verifies the database connection is alive
func (h *HealthHandler) checkDatabase(ctx context.Context) error {
	return h.db.Ping(ctx)
}

// checkPostGIS verifies PostGIS extension is available
func (h *HealthHandler) checkPostGIS(ctx context.Context) error {
	var version string
	err := h.db.QueryRow(ctx, "SELECT PostGIS_Version()").Scan(&version)
	if err != nil {
		return err
	}
	return nil
}

