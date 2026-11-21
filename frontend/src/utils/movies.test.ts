import { expect, it } from 'vitest'
import type { SearchResult } from '../types/api'
import { dateLabel, imageUrl, movieResults, movieYear } from './movies'

it('keeps movies from mixed results and accepts null results', () => {
  const result = { id: 29, title: 'Example', name: '', overview: '', poster_path: '',
    profile_path: '', known_for_department: '', vote_average: 0 }
  const results: SearchResult[] = ['person', 'movie', 'tv'].map(media_type => ({ ...result, media_type }))
  expect(movieResults(results)).toEqual([results[1]])
  expect(movieResults(null)).toEqual([])
})

it('uses TMDB image sizes and omits absent artwork and dates', () => {
  expect(imageUrl('/poster.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/poster.jpg')
  expect(imageUrl('', 'w1280')).toBeUndefined()
  expect(movieYear('2024-11-03')).toBe('2024')
  expect(movieYear('')).toBeUndefined()
  expect(dateLabel('')).toBeUndefined()
})
