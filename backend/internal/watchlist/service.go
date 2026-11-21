package watchlist

import (
	"context"
	"errors"

	"movie-app/backend/internal/movieenrichment"
)

var ErrInvalidMovieID = errors.New("invalid movie ID")

type Service struct {
	Repo     *Repository
	Enricher *movieenrichment.Service
}

func NewService(
	repo *Repository,
	enricher *movieenrichment.Service,
) *Service {
	return &Service{
		Repo:     repo,
		Enricher: enricher,
	}
}

func (s *Service) Add(ctx context.Context, userID string, movieID int) error {
	if movieID <= 0 {
		return ErrInvalidMovieID
	}
	return s.Repo.Add(ctx, userID, movieID)
}

func (s *Service) List(ctx context.Context, userID string) ([]Item, error) {
	return s.Repo.List(ctx, userID)
}

func (s *Service) Remove(ctx context.Context, userID string, movieID int) error {
	if movieID <= 0 {
		return ErrInvalidMovieID
	}

	return s.Repo.Remove(ctx, userID, movieID)
}

func (s *Service) ListEnriched(
	ctx context.Context,
	userID string,
) ([]EnrichedItem, error) {
	items, err := s.Repo.List(ctx, userID)
	if err != nil {
		return nil, err
	}

	movieIDs := make([]int, len(items))
	for i, item := range items {
		movieIDs[i] = item.MovieID
	}

	movies, err := s.Enricher.Enrich(ctx, movieIDs)
	if err != nil {
		return nil, err
	}

	result := make([]EnrichedItem, len(items))

	for i, item := range items {
		result[i] = EnrichedItem{
			Movie:   movies[i],
			AddedAt: item.AddedAt,
		}
	}

	return result, nil
}
