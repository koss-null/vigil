package main

import (
	"log"
	"net/http"

	"github.com/koss-null/vigil/internal/agent"
	"github.com/koss-null/vigil/internal/api"
	"github.com/koss-null/vigil/internal/config"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize system agent
	sysAgent := agent.NewSystemAgent()

	// Start background monitoring
	go sysAgent.StartMonitoring()

	// Initialize API handlers
	handler := api.NewHandler(sysAgent, "web/static/")

	// Start HTTP server
	log.Printf("Starting server on %s", cfg.ServerAddress)
	if err := http.ListenAndServe(cfg.ServerAddress, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
