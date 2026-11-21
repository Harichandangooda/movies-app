package watchedmovies

import (
	"encoding/json"
	"net/http"
	"strconv"

	"movie-app/backend/internal/auth"
)

type Handler struct {
	Service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{Service: service}
}

func getMovieID(r *http.Request) (int, error) {
	id, err := strconv.Atoi(r.PathValue("movie_id"))
	if err != nil || id <= 0 || id > 2147483647 {
		return 0, ErrInvalidMovieID
	}
	return id, nil
}

func (h *Handler) Add(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	movieID, err := getMovieID(r)
	if err != nil {
		http.Error(w, "Invalid movie ID", http.StatusBadRequest)
		return
	}

	if err := h.Service.Add(r.Context(), userID, movieID); err != nil {
		http.Error(w, "Could not add movie", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	items, err := h.Service.ListEnriched(r.Context(), userID)
	if err != nil {
		http.Error(w, "Could not retrieve watched movies", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")

	if err := json.NewEncoder(w).Encode(items); err != nil {
		// Log encoding error in production.
		return
	}
}

func (h *Handler) Remove(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	movieID, err := getMovieID(r)
	if err != nil {
		http.Error(w, "Invalid movie ID", http.StatusBadRequest)
		return
	}

	if err := h.Service.Remove(r.Context(), userID, movieID); err != nil {
		http.Error(w, "Could not remove movie", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
