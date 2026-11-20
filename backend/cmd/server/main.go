package main

import (
	"encoding/base64"
	"log"
	"net/http"
	"os"

	"movie-app/backend/internal/auth"
	"movie-app/backend/internal/database"
	"movie-app/backend/internal/handlers"
	"movie-app/backend/internal/home"
	"movie-app/backend/internal/tmdb"
	"movie-app/backend/internal/users"
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

	db, err := database.NewPostgresPool()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	log.Println("Connected to PostgreSQL")

	userRepository := users.NewRepository(db)

	secret, err := base64.StdEncoding.DecodeString(
		os.Getenv("JWT_SECRET"),
	)
	if err != nil {
		log.Fatalf("invalid JWT_SECRET encoding: %v", err)
	}

	tokenManager, err := auth.NewTokenManager(secret)
	if err != nil {
		log.Fatal(err)
	}

	authService := auth.NewService(userRepository, tokenManager)
	authHandler := auth.NewHandler(authService)

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
	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.Handle(
		"GET /api/users/me",
		auth.AuthMiddleware(
			tokenManager,
			http.HandlerFunc(authHandler.GetMe),
		),
	)

	log.Println("Server running on port 8000")
	log.Fatal(http.ListenAndServe(":8000", mux))

}
