package main

import (
	"encoding/json"
	"log"
	"movie-app/backend/internal/home"
	"movie-app/backend/internal/tmdb"
	"net/http"
)

// func main() {
// 	http.HandleFunc("GET /api/home", FetchHome)
// 	log.Fatal(http.ListenAndServe(":8000", nil))
// }

func main() {
	client, err := tmdb.NewClient()
	if err != nil {
		log.Fatal(err)
	}

	service := &home.Service{
		TMDB: client,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/home",
		func(w http.ResponseWriter, r *http.Request) {

			movies, err := service.GetHomeMovies(
				r.Context(),
			)
			if err != nil {
				log.Printf("Failed to fetch movies: %v", err)
				http.Error(
					w,
					"Failed to fetch homepage movies",
					http.StatusBadGateway,
				)
				return
			}

			w.Header().Set(
				"Content-Type",
				"application/json",
			)

			if err := json.NewEncoder(w).Encode(movies); err != nil {
				log.Printf("Failed to encode response: %v", err)
			}
		},
	)

	log.Println("Server running on :8000")
	log.Fatal(http.ListenAndServe(":8000", mux))
}
