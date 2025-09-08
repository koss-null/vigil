package api

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/koss-null/vigil/internal/agent"
)

//go:embed web/static/index.html
var staticIndex embed.FS

//go:embed web/static/app.js
var staticJS embed.FS

//go:embed web/static/styles.css
var staticCSS embed.FS

type Handler struct {
	agent *agent.SystemAgent
}

func NewHandler(agent *agent.SystemAgent) *Handler {
	return &Handler{
		agent: agent,
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/", "/index.html":
		h.serveIndexHTML(w, r)
	case "/static/js/app.js":
		h.serveAppJS(w, r)
	case "/static/css/styles.css":
		h.serveStylesCSS(w, r)

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

func (h *Handler) serveIndexHTML(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	h.serveEmbeddedFile(w, r, staticIndex, "web/static/index.html")
}

func (h *Handler) serveAppJS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/javascript")
	h.serveEmbeddedFile(w, r, staticJS, "web/static/app.js")
}

func (h *Handler) serveStylesCSS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/css")
	h.serveEmbeddedFile(w, r, staticCSS, "web/static/styles.css")
}

func (h *Handler) serveEmbeddedFile(w http.ResponseWriter, r *http.Request, fs embed.FS, filePath string) {
	file, err := fs.Open(filePath)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer file.Close()

	// Get file info for caching headers
	info, err := file.Stat()
	if err != nil {
		http.Error(w, "Could not get file info", http.StatusInternalServerError)
		return
	}

	// Set caching headers (1 hour for static assets)
	if filePath != "web/static/index.html" {
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}

	// Serve the content
	http.ServeContent(w, r, filePath, info.ModTime(), file.(io.ReadSeeker))
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
