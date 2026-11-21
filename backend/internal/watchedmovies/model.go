package watchedmovies

import (
	"movie-app/backend/internal/tmdb"
	"time"
)

type Item struct {
	MovieID   int       `json:"movie_id"`
	WatchedAt time.Time `json:"watched_at"`
}

type EnrichedItem struct {
	tmdb.Movie
	WatchedAt time.Time `json:"watched_at"`
}
