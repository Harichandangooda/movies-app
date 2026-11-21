import { queryOptions } from '@tanstack/react-query'
import type { HomeResponse, Movie, SearchResponse } from '../types/api'
import { request } from './client'

export const homeOptions = queryOptions({
  queryKey: ['home'],
  queryFn: ({ signal }) => request<HomeResponse>('/home', { signal }),
})

export const movieOptions = (id: number) => queryOptions({
  queryKey: ['movie', id],
  queryFn: ({ signal }) => request<Movie>('/movie/' + id, { signal }),
})

export const searchOptions = (query: string, page: number) => queryOptions({
  queryKey: ['search', query, page],
  queryFn: ({ signal }) => request<SearchResponse>(
    '/search?' + new URLSearchParams({ q: query, page: String(page) }), { signal },
  ),
})
