package watchedmovies

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{
		DB: db,
	}
}

func (r *Repository) Add(ctx context.Context, userID string, movieID int) error {
	query := `INSERT INTO watched_movies (user_id, movie_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, movie_id) DO NOTHING
	`
	_, err := r.DB.Exec(ctx, query, userID, movieID)
	if err != nil {
		return fmt.Errorf("add to watched_movies: %w", err)
	}
	return nil
}

func (r *Repository) List(ctx context.Context, userId string) ([]Item, error) {
	query := `
		SELECT movie_id, watched_at
		FROM watched_movies
		WHERE user_id = $1
		ORDER BY watched_at DESC, movie_id DESC
	`
	rows, err := r.DB.Query(ctx, query, userId)
	if err != nil {
		return nil, fmt.Errorf("query watched_movies: %w", err)
	}

	defer rows.Close()

	items := make([]Item, 0)

	for rows.Next() {
		var item Item
		if err := rows.Scan(
			&item.MovieID,
			&item.WatchedAt,
		); err != nil {
			return nil, fmt.Errorf("scan watched_movies: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate watched_movies: %w", err)
	}

	return items, nil
}

func (r *Repository) Remove(ctx context.Context, userID string, movieID int) error {
	query := `DELETE FROM watched_movies
		WHERE user_id = $1 AND movie_id = $2
	`
	_, err := r.DB.Exec(ctx, query, userID, movieID)
	if err != nil {
		return fmt.Errorf("remove from watched_movies: %w", err)
	}
	return nil
}
