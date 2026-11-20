package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"movie-app/backend/internal/home"
)

type HomeHandler struct {
	Service *home.Service
}

func (h *HomeHandler) GetHome(w http.ResponseWriter, r *http.Request) {
	movies, err := h.Service.GetHomeMovies(r.Context())
	if err != nil {
		log.Printf("Error fetching home movies: %v", err)
		http.Error(w, "Failed to fetch home movies", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(movies); err != nil {
		log.Printf("Error encoding home movies: %v", err)
	}
}
