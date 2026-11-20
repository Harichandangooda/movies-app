package users

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUserNotFound = errors.New("user not found")

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{
		DB: db,
	}
}

func (r *Repository) CreateUser(ctx context.Context, email string, passwordHash string) (*User, error) {

	query := `
	INSERT INTO users (email, password_hash)
	VALUES ($1, $2)
	RETURNING id, email, created_at
	`
	var user User
	err := r.DB.QueryRow(ctx, query, email, passwordHash).Scan(&user.ID, &user.Email, &user.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &user, nil
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	query := `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`

	var user User
	err := r.DB.QueryRow(ctx, query, email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrUserNotFound
	}

	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &user, nil
}

func (r *Repository) GetUserByID(
	ctx context.Context,
	userID string,
) (*User, error) {

	query := `
        SELECT id, email, created_at
        FROM users
        WHERE id = $1
    `

	var user User

	err := r.DB.QueryRow(
		ctx,
		query,
		userID,
	).Scan(
		&user.ID,
		&user.Email,
		&user.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrUserNotFound
	}

	if err != nil {
		return nil, fmt.Errorf("get user by ID: %w", err)
	}

	return &user, nil
}
