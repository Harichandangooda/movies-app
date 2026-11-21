import { Bookmark, Check, Eye, Minus } from 'lucide-react'
import { motion } from 'motion/react'
import { useCollectionToggle } from '../../hooks/useCollection'
import type { Collection } from '../../types/api'

export function CollectionButton({ collection, id, compact = false }: {
  collection: Collection; id: number; compact?: boolean
}) {
  const { query, saved, toggle, busy, error, success } = useCollectionToggle(collection, id)
  const watchlist = collection === 'watchlist'
  const label = watchlist ? (saved ? 'Remove from Watchlist' : 'Add to Watchlist')
    : (saved ? 'Mark as Unwatched' : 'Mark as Watched')
  const Icon = compact ? Minus : saved ? Check : watchlist ? Bookmark : Eye
  return <div className="collection-action">
    {query.isError
      ? <button className="button secondary" onClick={() => void query.refetch()}>Retry {watchlist ? 'watchlist' : 'watched history'}</button>
      : <button className={'button secondary' + (compact ? ' compact' : '')} disabled={busy || !query.isSuccess}
        onClick={toggle} aria-busy={busy}>
        <motion.span key={String(saved)} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}><Icon size={18} /></motion.span>
        {busy ? 'Saving…' : compact && saved ? 'Remove' : label}
      </button>}
    {query.isError && <span className="inline-error" role="alert">{query.error.message}</span>}
    {error && <span className="inline-error" role="alert">{error.message}</span>}
    <span className="sr-only" role="status">{success && !busy ? 'Collection updated.' : ''}</span>
  </div>
}
