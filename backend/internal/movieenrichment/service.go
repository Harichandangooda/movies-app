package movieenrichment

import (
	"context"
	"fmt"
	"sync"

	"movie-app/backend/internal/tmdb"
)

// Fetcher lets us reuse the existing TMDB client.
type Fetcher interface {
	GetMovie(ctx context.Context, movieID int) (tmdb.Movie, error)
}

type Service struct {
	Fetcher Fetcher
}

func NewService(fetcher Fetcher) *Service {
	return &Service{Fetcher: fetcher}
}

func (s *Service) Enrich(
	ctx context.Context,
	movieIDs []int,
) ([]tmdb.Movie, error) {
	movies := make([]tmdb.Movie, len(movieIDs))

	// Limit concurrent TMDB requests to five.
	semaphore := make(chan struct{}, 5)

	var wg sync.WaitGroup
	var mu sync.Mutex
	var firstErr error

	for i, movieID := range movieIDs {
		wg.Add(1)

		go func(index, id int) {
			defer wg.Done()

			select {
			case semaphore <- struct{}{}:
				defer func() { <-semaphore }()
			case <-ctx.Done():
				mu.Lock()
				if firstErr == nil {
					firstErr = ctx.Err()
				}
				mu.Unlock()
				return
			}

			movie, err := s.Fetcher.GetMovie(ctx, id)
			if err != nil {
				mu.Lock()
				if firstErr == nil {
					firstErr = fmt.Errorf(
						"fetch movie %d: %w", id, err,
					)
				}
				mu.Unlock()
				return
			}

			movies[index] = movie
		}(i, movieID)
	}

	wg.Wait()

	if firstErr != nil {
		return nil, firstErr
	}

	return movies, nil
}
