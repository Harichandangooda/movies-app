package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/golang-jwt/jwt/v5"
)

const (
	TokenIssuer         = "movie-app"
	AccessTokenDuration = 15 * time.Minute
)

type TokenManager struct {
	secret []byte
}

func NewTokenManager(secret []byte) (*TokenManager, error) {
	if len(secret) < 32 {
		return nil, errors.New("JWT secret must be at least 32 bytes")
	}

	return &TokenManager{secret: secret}, nil
}

func (tm *TokenManager) GenerateToken(userID string) (string, error) {
	now := time.Now()

	claims := jwt.RegisteredClaims{
		Subject:   userID,
		Issuer:    TokenIssuer,
		IssuedAt:  jwt.NewNumericDate(now),
		NotBefore: jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(AccessTokenDuration)),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString(tm.secret)
	if err != nil {
		return "", fmt.Errorf("sign JWT: %w", err)
	}

	return signedToken, nil
}

func (tm *TokenManager) ValidateToken(
	tokenString string,
) (string, error) {

	claims := &jwt.RegisteredClaims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (any, error) {
			return tm.secret, nil
		},
		jwt.WithValidMethods([]string{
			jwt.SigningMethodHS256.Alg(),
		}),
		jwt.WithIssuer(TokenIssuer),
		jwt.WithExpirationRequired(),
		jwt.WithIssuedAt(),
		jwt.WithLeeway(5*time.Second),
	)

	if err != nil {
		return "", fmt.Errorf("validate JWT: %w", err)
	}

	if !token.Valid || claims.Subject == "" {
		return "", errors.New("invalid JWT")
	}

	if _, err := uuid.Parse(claims.Subject); err != nil {
		return "", errors.New("invalid user ID in JWT")
	}

	return claims.Subject, nil
}
