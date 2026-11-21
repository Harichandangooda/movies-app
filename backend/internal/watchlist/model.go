package watchlist

import (
	"movie-app/backend/internal/tmdb"
	"time"
)

type Item struct {
	MovieID int       `json:"movie_id"`
	AddedAt time.Time `json:"added_at"`
}

type EnrichedItem struct {
	tmdb.Movie
	AddedAt time.Time `json:"added_at"`
}
