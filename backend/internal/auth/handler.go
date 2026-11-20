package auth

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"movie-app/backend/internal/users"
)

type Handler struct {
	Service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{Service: service}
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

func (h *Handler) Register(
	w http.ResponseWriter,
	r *http.Request,
) {
	// Limit request body size
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req RegisterRequest

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid JSON request", http.StatusBadRequest)
		return
	}

	// Reject additional JSON values
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		http.Error(w, "Invalid JSON request", http.StatusBadRequest)
		return
	}

	user, err := h.Service.Register(
		r.Context(),
		req.Email,
		req.Password,
	)

	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidEmail),
			errors.Is(err, ErrInvalidPassword):
			http.Error(w, err.Error(), http.StatusBadRequest)

		case errors.Is(err, ErrEmailExists):
			http.Error(w, "Email already registered", http.StatusConflict)

		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Location", "/api/users/"+user.ID)
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(user)
}

func (h *Handler) Login(
	w http.ResponseWriter,
	r *http.Request,
) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req LoginRequest

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid JSON request", http.StatusBadRequest)
		return
	}

	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		http.Error(w, "Invalid JSON request", http.StatusBadRequest)
		return
	}

	token, err := h.Service.Login(
		r.Context(),
		req.Email,
		req.Password,
	)

	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			http.Error(
				w,
				"Invalid email or password",
				http.StatusUnauthorized,
			)
			return
		}

		http.Error(
			w,
			"Internal server error",
			http.StatusInternalServerError,
		)
		return
	}

	response := LoginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   int(AccessTokenDuration.Seconds()),
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		// Response headers have already been sent.
		// Log the error in a production application.
		return
	}
}

func (h *Handler) GetMe(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID, ok := UserIDFromContext(r.Context())
	if !ok {
		http.Error(
			w,
			"Unauthorized",
			http.StatusUnauthorized,
		)
		return
	}

	user, err := h.Service.Users.GetUserByID(
		r.Context(),
		userID,
	)

	if err != nil {
		if errors.Is(err, users.ErrUserNotFound) {
			http.Error(
				w,
				"User not found",
				http.StatusUnauthorized,
			)
			return
		}

		http.Error(
			w,
			"Internal server error",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")

	if err := json.NewEncoder(w).Encode(user); err != nil {
		// Log the encoding error in a production application.
		return
	}
}
