package tmdb

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"
)

const baseURL = "https://api.themoviedb.org/3"

type Movie struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	Overview    string  `json:"overview"`
	PosterPath  string  `json:"poster_path"`
	ReleaseDate string  `json:"release_date"`
	VoteAverage float64 `json:"vote_average"`
}

type MovieResponse struct {
	Page         int     `json:"page"`
	Results      []Movie `json:"results"`
	TotalPages   int     `json:"total_pages"`
	TotalResults int     `json:"total_results"`
}

type SearchResult struct {
	ID          int     `json:"id"`
	MediaType   string  `json:"media_type"`
	Title       string  `json:"title"`
	Name        string  `json:"name"`
	Overview    string  `json:"overview"`
	PosterPath  string  `json:"poster_path"`
	ProfilePath string  `json:"profile_path"`
	KnownFor    string  `json:"known_for_department"`
	VoteAverage float64 `json:"vote_average"`
}

type SearchResponse struct {
	Page         int            `json:"page"`
	Results      []SearchResult `json:"results"`
	TotalPages   int            `json:"total_pages"`
	TotalResults int            `json:"total_results"`
}

type Client struct {
	Client *http.Client
	Token  string
}

func NewClient() (*Client, error) {
	token := os.Getenv("API_READ_ACCESS_TOKEN")
	if token == "" {
		return nil, fmt.Errorf("TMDB token not configured")
	}
	return &Client{
		Client: &http.Client{Timeout: 10 * time.Second},
		Token:  token,
	}, nil
}

func (c *Client) FetchMovies(ctx context.Context, endpoint string) (*MovieResponse, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", baseURL+endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.Token)

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("TMDB API request failed with status: %s", resp.Status)
	}

	var movieResponse MovieResponse
	if err := json.NewDecoder(resp.Body).Decode(&movieResponse); err != nil {
		return nil, err
	}

	return &movieResponse, nil

}

func (c *Client) FetchMovie(ctx context.Context, endpoint string) (*Movie, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", baseURL+endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.Token)

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("TMDB API request failed with status: %s", resp.Status)
	}
	var movie Movie
	if err := json.NewDecoder(resp.Body).Decode(&movie); err != nil {
		return nil, err
	}
	return &movie, nil
}

func (c *Client) Search(
	ctx context.Context,
	query string,
	page int,
) (*SearchResponse, error) {

	endpoint := baseURL + "/search/multi"

	req, err := http.NewRequestWithContext(
		ctx, http.MethodGet, endpoint, nil,
	)
	if err != nil {
		return nil, err
	}

	params := req.URL.Query()
	params.Set("query", query)
	params.Set("page", strconv.Itoa(page))
	req.URL.RawQuery = params.Encode()

	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("Accept", "application/json")

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("TMDB returned %s", resp.Status)
	}

	var result SearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}
