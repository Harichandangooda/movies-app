package home

import (
	"context"
	"fmt"
	"movie-app/backend/internal/tmdb"
	"sync"
)

type HomeResponse struct {
	Trending   []tmdb.Movie `json:"trending"`
	Popular    []tmdb.Movie `json:"popular"`
	NowPlaying []tmdb.Movie `json:"now_playing"`
}

type Service struct {
	TMDB *tmdb.Client
}

func (s *Service) GetHomeMovies(ctx context.Context) (*HomeResponse, error) {
	var wg sync.WaitGroup
	var result HomeResponse
	var trendingErr, popularErr, nowPlayingErr error

	wg.Add(3)

	go func() {
		defer wg.Done()
		movies, err := s.TMDB.FetchMovies(ctx, "/trending/movie/week")
		if err != nil {
			trendingErr = err
			return
		}
		result.Trending = movies.Results
	}()

	go func() {
		defer wg.Done()
		movies, err := s.TMDB.FetchMovies(ctx, "/movie/popular")
		if err != nil {
			popularErr = err
			return
		}
		result.Popular = movies.Results
	}()

	go func() {
		defer wg.Done()
		movies, err := s.TMDB.FetchMovies(ctx, "/movie/now_playing")
		if err != nil {
			nowPlayingErr = err
			return
		}
		result.NowPlaying = movies.Results
	}()

	wg.Wait()

	if trendingErr != nil {
		return nil, fmt.Errorf("error fetching trending movies: %w", trendingErr)
	}
	if popularErr != nil {
		return nil, fmt.Errorf("error fetching popular movies: %w", popularErr)
	}
	if nowPlayingErr != nil {
		return nil, fmt.Errorf("error fetching now playing movies: %w", nowPlayingErr)
	}

	return &result, nil
}
