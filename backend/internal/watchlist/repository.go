package watchlist

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
	query := `INSERT INTO watchlist (user_id, movie_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, movie_id) DO NOTHING
	`
	_, err := r.DB.Exec(ctx, query, userID, movieID)
	if err != nil {
		return fmt.Errorf("add to watchlist: %w", err)
	}
	return nil
}

func (r *Repository) List(ctx context.Context, userID string) ([]Item, error) {
	query := `SELECT movie_id, added_at FROM watchlist
		WHERE user_id = $1
		ORDER BY added_at DESC, movie_id DESC
	`
	rows, err := r.DB.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("query watchlist: %w", err)
	}

	defer rows.Close()

	items := make([]Item, 0)

	for rows.Next() {
		var item Item
		if err := rows.Scan(
			&item.MovieID,
			&item.AddedAt,
		); err != nil {
			return nil, fmt.Errorf("scan watchlist: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate watchlist: %w", err)
	}

	return items, nil
}

func (r *Repository) Remove(ctx context.Context, userID string, movieID int) error {
	query := `DELETE FROM watchlist
		WHERE user_id = $1 AND movie_id = $2
	`
	_, err := r.DB.Exec(ctx, query, userID, movieID)
	if err != nil {
		return fmt.Errorf("remove from watchlist: %w", err)
	}
	return nil
}
