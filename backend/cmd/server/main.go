package main

import (
	"log"
	"net/http"

	"movie-app/backend/internal/handlers"
	"movie-app/backend/internal/home"
	"movie-app/backend/internal/tmdb"
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

	homeHandler := &handlers.HomeHandler{
		Service: service,
	}

	movieHandler := &handlers.MovieHandler{
		Service: service,
	}

	searchHandler := &handlers.SearchHandler{
		Service: service,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/home", homeHandler.GetHome)
	mux.HandleFunc("GET /api/movie/{id}", movieHandler.GetMovie)
	mux.HandleFunc("GET /api/search", searchHandler.Search)

	log.Println("Server running on port 8000")
	log.Fatal(http.ListenAndServe(":8000", mux))

}
