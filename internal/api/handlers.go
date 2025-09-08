package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/koss-null/vigil/internal/agent"
)

type Handler struct {
	agent     *agent.SystemAgent
	staticDir string
}

func NewHandler(agent *agent.SystemAgent, staticDir string) *Handler {
	return &Handler{
		agent:     agent,
		staticDir: staticDir,
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/", "/index.html":
		h.serveStaticFile(w, r, "index.html")
	case "/static/js/app.js":
		h.serveStaticFile(w, r, "js/app.js")
	case "/static/css/styles.css":
		h.serveStaticFile(w, r, "css/styles.css")

	case "/api/system-info":
		h.getSystemInfo(w, r)
	case "/api/nodes":
		h.getNodes(w, r)
	case "/api/services":
		h.getServices(w, r)

	default:
		http.NotFound(w, r)
	}
}

func (h *Handler) serveStaticFile(w http.ResponseWriter, r *http.Request, filePath string) {
	fullPath := filepath.Join(h.staticDir, filePath)

	// Set appropriate content type based on file extension
	switch filepath.Ext(filePath) {
	case ".js":
		w.Header().Set("Content-Type", "application/javascript")
	case ".css":
		w.Header().Set("Content-Type", "text/css")
	case ".html":
		w.Header().Set("Content-Type", "text/html")
	}

	http.ServeFile(w, r, fullPath)
}

func (h *Handler) getSystemInfo(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	info, err := h.agent.GetSystemInfo()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(info); err != nil {
		fmt.Printf("Failed to encode system-info json: %q\n", err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Printf("Server info was served for remote addr: %s [took: %v]\n", r.RemoteAddr, time.Since(start))
}

func (h *Handler) getNodes(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Nodes endpoint - coming soon"})
}

func (h *Handler) getServices(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Services endpoint - coming soon"})
}
