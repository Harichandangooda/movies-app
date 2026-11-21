import type { SearchResult } from '../types/api'

export const imageUrl = (path: string, size: 'w342' | 'w500' | 'w780' | 'w1280' | 'original') =>
  path ? 'https://image.tmdb.org/t/p/' + size + path : undefined

export const movieYear = (date?: string) => date?.match(/^\d{4}(?=-)/)?.[0]
export const movieResults = (results: SearchResult[] | null) =>
  (results ?? []).filter(result => result.media_type === 'movie')

export function dateLabel(date: string) {
  const value = new Date(date.length === 10 ? date + 'T00:00:00Z' : date)
  return Number.isNaN(value.valueOf()) ? undefined :
    new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeZone: 'UTC' }).format(value)
}
