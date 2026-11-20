package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"movie-app/backend/internal/home"
)

type MovieHandler struct {
	Service *home.Service
}

func (m *MovieHandler) GetMovie(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	movieID, err := strconv.Atoi(id)
	if err != nil || movieID <= 0 {
		http.Error(
			w,
			"Invalid movie ID",
			http.StatusBadRequest,
		)
		return
	}
	movie, err := m.Service.GetMovie(r.Context(), strconv.Itoa(movieID))
	if err != nil {
		log.Printf("Error fetching movie: %v", err)
		http.Error(w, "Failed to fetch movie", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(movie); err != nil {
		log.Printf("Error encoding movie: %v", err)
	}
}
