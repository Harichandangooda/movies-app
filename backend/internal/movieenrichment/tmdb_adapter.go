package movieenrichment

import (
	"context"
	"strconv"

	"movie-app/backend/internal/tmdb"
)

type TMDBAdapter struct {
	Client *tmdb.Client
}

func (a *TMDBAdapter) GetMovie(
	ctx context.Context,
	movieID int,
) (tmdb.Movie, error) {
	endpoint := "/movie/" + strconv.Itoa(movieID)

	movie, err := a.Client.FetchMovie(ctx, endpoint)
	if err != nil {
		return tmdb.Movie{}, err
	}

	return *movie, nil
}
