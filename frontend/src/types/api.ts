export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  vote_average: number
}

export interface SearchResult {
  id: number
  media_type: string
  title: string
  name: string
  overview: string
  poster_path: string
  profile_path: string
  known_for_department: string
  vote_average: number
}

export interface SearchResponse {
  page: number
  results: SearchResult[] | null
  total_pages: number
  total_results: number
}

export interface HomeResponse {
  trending: Movie[] | null
  popular: Movie[] | null
  now_playing: Movie[] | null
  top_rated: Movie[] | null
}

export type Collection = 'watchlist' | 'watched'
export type WatchlistItem = Movie & { added_at: string }
export type WatchedItem = Movie & { watched_at: string }
export interface User { id: string; email: string; created_at: string }
export interface LoginResponse { access_token: string; token_type: string; expires_in: number }
export interface Credentials { email: string; password: string }

export type MovieCardData = Pick<Movie, 'id' | 'title' | 'poster_path' | 'vote_average'> &
  Partial<Pick<Movie, 'release_date'>>
