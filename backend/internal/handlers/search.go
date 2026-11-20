package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"movie-app/backend/internal/home"
)

type SearchHandler struct {
	Service *home.Service
}

func (h *SearchHandler) Search(
	w http.ResponseWriter,
	r *http.Request,
) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))

	if len([]rune(query)) < 3 {
		http.Error(w, "Minimum 3 characters required",
			http.StatusBadRequest)
		return
	}

	page := 1
	if raw := r.URL.Query().Get("page"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 500 {
			http.Error(w, "Invalid page", http.StatusBadRequest)
			return
		}
		page = parsed
	}

	result, err := h.Service.Search(r.Context(), query, page)
	if err != nil {
		http.Error(w, "Search failed", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
