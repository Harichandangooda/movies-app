import { afterEach, describe, expect, it, vi } from 'vitest'
import { request } from './client'
import { searchOptions } from './movies'

afterEach(() => vi.unstubAllGlobals())

describe('Go API client', () => {
  it.each(['POST', 'DELETE'] as const)('accepts a 204 from %s and sends the bearer token', async method => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(request<void>('/watchlist/42', { method, token: 'example-token' })).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('/api/watchlist/42', expect.objectContaining({ method, cache: 'no-store' }))
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer example-token')
  })

  it('preserves a protected endpoint error status and plain-text message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unauthorized\n', { status: 401 })))
    await expect(request('/users/me', { token: 'expired' })).rejects.toMatchObject({
      status: 401, message: 'Unauthorized',
    })
  })

  it('sends registration credentials as JSON', async () => {
    const payload = { email: 'test@example.org', password: 'password-example' }
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 'test-user' }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(request('/auth/register', { method: 'POST', body: payload })).resolves.toEqual({ id: 'test-user' })
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST', body: JSON.stringify(payload),
    }))
    expect(fetchMock.mock.calls[0][1].headers.get('Content-Type')).toBe('application/json')
  })

  it('escapes a multi-search query and forwards the page and abort signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ results: [], page: 2, total_pages: 2, total_results: 0 }))
    vi.stubGlobal('fetch', fetchMock)
    const { signal } = new AbortController()
    const { QueryClient } = await import('@tanstack/react-query')
    const queryClient = new QueryClient()
    await queryClient.fetchQuery(searchOptions('a & b', 2))
    expect(fetchMock).toHaveBeenCalledWith('/api/search?q=a+%26+b&page=2', expect.objectContaining({
      signal: expect.any(signal.constructor),
    }))
  })
})
