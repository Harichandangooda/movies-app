import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { ApiError } from './api/client'
import { AuthProvider } from './contexts/Auth'
import App from './App'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (attempt, error) => attempt < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
})

function MotionPreferences({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  return <MotionConfig reducedMotion="user" transition={reduced ? { duration: 0 } : undefined}>{children}</MotionConfig>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={queryClient}>
    <BrowserRouter><AuthProvider><MotionPreferences><App /></MotionPreferences></AuthProvider></BrowserRouter>
  </QueryClientProvider></StrictMode>,
)
