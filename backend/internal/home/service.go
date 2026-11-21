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
	TopRated   []tmdb.Movie `json:"top_rated"`
}

type Service struct {
	TMDB *tmdb.Client
}

func (s *Service) GetHomeMovies(ctx context.Context) (*HomeResponse, error) {
	var wg sync.WaitGroup
	var result HomeResponse
	var trendingErr, popularErr, nowPlayingErr, topRatedErr error

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
		movies, err := s.TMDB.FetchMovies(ctx, "/movie/top_rated")
		if err != nil {
			topRatedErr = err
			return
		}
		result.TopRated = movies.Results
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
	if topRatedErr != nil {
		return nil, fmt.Errorf("error fetching top rated movies: %w", popularErr)
	}
	if nowPlayingErr != nil {
		return nil, fmt.Errorf("error fetching now playing movies: %w", nowPlayingErr)
	}

	return &result, nil
}

func (s *Service) GetMovie(
	ctx context.Context,
	id string,
) (*tmdb.Movie, error) {

	movie, err := s.TMDB.FetchMovie(ctx, "/movie/"+id)
	if err != nil {
		return nil, fmt.Errorf(
			"error fetching movie: %w", err,
		)
	}

	return movie, nil
}

func (s *Service) Search(
	ctx context.Context,
	query string,
	page int,
) (*tmdb.SearchResponse, error) {

	results, err := s.TMDB.Search(ctx, query, page)
	if err != nil {
		return nil, fmt.Errorf("error searching TMDB: %w", err)
	}

	filtered := make([]tmdb.SearchResult, 0, len(results.Results))

	for _, result := range results.Results {
		if result.MediaType == "movie" || result.MediaType == "person" {
			filtered = append(filtered, result)
		}
	}

	results.Results = filtered

	return results, nil
}
