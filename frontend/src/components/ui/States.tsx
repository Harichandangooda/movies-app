import { Film } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

export function LoadingSkeleton({ kind = 'grid' }: { kind?: 'grid' | 'hero' | 'row' }) {
  return <div role="status" aria-label="Loading movies" className={kind === 'hero' ? 'skeleton hero-skeleton' : kind === 'row' ? 'movie-row' : 'movie-grid'}>
    {kind !== 'hero' && Array.from({ length: 6 }, (_, index) =>
      <div className="skeleton poster" aria-hidden="true" key={index} />)}
  </div>
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><Film aria-hidden="true" /><h2>{title}</h2>{children}</div>
}

export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  return <div className="error-state" role="alert">
    <p>{error.message}</p>
    {retry && <button className="button secondary" onClick={retry}>Try again</button>}
  </div>
}

export function Page({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  return <motion.div className="page" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
    {children}
  </motion.div>
}
