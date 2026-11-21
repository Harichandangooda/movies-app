export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: object
  token?: string
  signal?: AbortSignal
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options
  const headers = new Headers({ Accept: 'application/json' })
  if (token) headers.set('Authorization', 'Bearer ' + token)
  if (body) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch('/api' + path, {
      method, headers, signal, body: body && JSON.stringify(body),
      cache: token ? 'no-store' : 'default',
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(0, 'Could not reach Afterlight. Please try again.')
  }
  if (!response.ok) {
    const message = response.headers.get('Content-Type')?.startsWith('text/plain')
      ? (await response.text()).trim()
      : ''
    throw new ApiError(response.status, message || 'Something went wrong. Please try again.')
  }
  return (response.status === 204 ? undefined : await response.json()) as T
}
