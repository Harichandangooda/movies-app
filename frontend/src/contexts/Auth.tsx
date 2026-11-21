import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, request } from '../api/client'
import type { Credentials, LoginResponse } from '../types/api'

interface Session { id: number; token: string; expiresAt: number }
interface Auth {
  session: Session | null
  expired: boolean
  login(credentials: Credentials, signal?: AbortSignal): Promise<void>
  logout(): void
  authorized<T>(path: string, options?: { method?: 'POST' | 'DELETE'; signal?: AbortSignal }): Promise<T>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [expired, setExpired] = useState(false)
  const active = useRef<Session | null>(null)
  const nextId = useRef(0)
  const client = useQueryClient()

  const end = useCallback((isExpired = false) => {
    const previous = active.current
    active.current = null
    setSession(null)
    setExpired(isExpired)
    if (previous) {
      const queryKey = ['session', previous.id]
      void client.cancelQueries({ queryKey })
      client.removeQueries({ queryKey })
      const mutations = client.getMutationCache()
      for (const mutation of mutations.findAll({ mutationKey: queryKey })) mutations.remove(mutation)
    }
  }, [client])

  useEffect(() => {
    if (!session) return
    const timeout = window.setTimeout(() => end(true), Math.max(0, session.expiresAt - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [session, end])

  async function login(credentials: Credentials, signal?: AbortSignal) {
    const data = await request<LoginResponse>('/auth/login', { method: 'POST', body: credentials, signal })
    signal?.throwIfAborted()
    end()
    const current = { id: ++nextId.current, token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
    active.current = current
    setSession(current)
  }

  async function authorized<T>(path: string, options?: { method?: 'POST' | 'DELETE'; signal?: AbortSignal }) {
    if (!session || active.current !== session) throw new ApiError(401, 'Please sign in.')
    try {
      return await request<T>(path, { ...options, token: session.token })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && active.current === session) end(true)
      throw error
    }
  }

  return <AuthContext.Provider value={{ session, expired, login, logout: () => end(), authorized }}>
    {children}
  </AuthContext.Provider>
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('AuthProvider is required')
  return auth
}
