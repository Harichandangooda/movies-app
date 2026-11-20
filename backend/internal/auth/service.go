package auth

import (
	"context"
	"errors"
	"fmt"
	"movie-app/backend/internal/users"
	"net/mail"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidEmail       = errors.New("invalid email")
	ErrInvalidPassword    = errors.New("password must be at leat 8 characters")
	ErrEmailExists        = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type Service struct {
	Users  *users.Repository
	Tokens *TokenManager
}

func NewService(users *users.Repository, tokens *TokenManager) *Service {
	return &Service{
		Users:  users,
		Tokens: tokens,
	}
}

func (s *Service) Register(ctx context.Context, email string, password string) (*users.User, error) {

	email = strings.ToLower(strings.TrimSpace(email))

	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address != email {
		return nil, ErrInvalidEmail
	}

	if len(password) < 8 || len(password) > 72 {
		return nil, ErrInvalidPassword
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)

	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.Users.CreateUser(ctx, email, string(hash))

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) &&
			pgErr.Code == "23505" {
			return nil, ErrEmailExists
		}

		return nil, fmt.Errorf("register user: %w", err)
	}

	return user, nil
}

func (s *Service) Login(
	ctx context.Context,
	email string,
	password string,
) (string, error) {

	email = strings.ToLower(strings.TrimSpace(email))

	user, err := s.Users.GetUserByEmail(ctx, email)

	if errors.Is(err, users.ErrUserNotFound) {
		return "", ErrInvalidCredentials
	}

	if err != nil {
		return "", fmt.Errorf("lookup user: %w", err)
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(password),
	)

	if err != nil {
		return "", ErrInvalidCredentials
	}

	token, err := s.Tokens.GenerateToken(user.ID)
	if err != nil {
		return "", fmt.Errorf("generate access token: %w", err)
	}

	return token, nil
}
