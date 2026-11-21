import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, LogOut, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { request } from '../api/client'
import { CollectionButton } from '../components/movies/CollectionButton'
import { MovieGrid } from '../components/movies/Movies'
import { EmptyState, ErrorState, LoadingSkeleton, Page } from '../components/ui/States'
import { useAuth } from '../contexts/Auth'
import { useCollection } from '../hooks/useCollection'
import type { Collection, User, WatchedItem, WatchlistItem } from '../types/api'
import { dateLabel } from '../utils/movies'

export function PersonalPage({ collection }: { collection: Collection }) {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <CollectionPage key={collection} collection={collection} />
}

function CollectionPage({ collection }: { collection: Collection }) {
  const query = useCollection(collection)
  const watchlist = collection === 'watchlist'
  return <Page><div className="shell inner-page">
    <h1>{watchlist ? 'My Watchlist' : 'Watched Movies'}</h1>
    {query.isPending ? <LoadingSkeleton /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} />
      : query.data.length ? <MovieGrid<WatchlistItem | WatchedItem> movies={query.data} action={movie => <>
        <p className="card-date">{'added_at' in movie ? 'Saved ' + (dateLabel(movie.added_at) ?? '') : 'Watched ' + (dateLabel(movie.watched_at) ?? '')}</p>
        <CollectionButton compact collection={collection} id={movie.id} />
      </>} /> : <EmptyState title={watchlist ? 'Your watchlist is empty' : 'Your watched history is empty'}>
        <p>{watchlist ? 'Save a movie to keep it on your list.' : 'Mark a movie as watched from its details page.'}</p>
        <Link className="button primary" to="/browse">Browse movies</Link>
      </EmptyState>}
  </div></Page>
}

export function AuthPage({ register = false }: { register?: boolean }) {
  const { session, login, expired } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(false)
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])
  const requested = location.state?.from
  const from = typeof requested === 'string' && /^\/(?![\\/])/.test(requested) ? requested : '/profile'
  if (session) return <Navigate to={from} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email')).trim()
    const password = String(data.get('password'))
    const size = new TextEncoder().encode(password).length
    setError('')
    if (!email || !password || (register && (size < 8 || size > 72))) {
      setError(register ? 'Enter your email and a password between 8 and 72 UTF-8 bytes.' : 'Enter your email and password.')
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    try {
      if (register && !created) {
        await request<User>('/auth/register', { method: 'POST', body: { email, password }, signal: controller.signal })
        setCreated(true)
      }
      await login({ email, password }, controller.signal)
      navigate(from, { replace: true })
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Please try again.')
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return <Page><div className="shell auth-wrap">
    <section className="auth-card">
      <div className="auth-icon"><KeyRound size={25} /></div>
      <h1>{register && !created ? 'Create an account' : 'Sign in'}</h1>
      {created && <p className="muted" role="status">Account created. You can sign in now.</p>}
      {!register && expired && <p className="muted" role="status">Your session expired. Sign in to continue.</p>}
      <form className="auth-form" onSubmit={submit}>
        <label>Email<input required type="email" name="email" autoComplete="email" /></label>
        <label>Password<input required type="password" name="password"
          autoComplete={register && !created ? 'new-password' : 'current-password'} aria-describedby={register && !created ? 'password-rule' : undefined} /></label>
        {register && !created && <p className="muted form-hint" id="password-rule">Use a password between 8 and 72 UTF-8 bytes.</p>}
        {error && <p role="alert" className="inline-error">{error}</p>}
        <button className="button primary" disabled={busy} aria-busy={busy}>
          {busy ? 'Please wait…' : register && !created ? 'Create account' : 'Sign in'}
        </button>
      </form>
      {register ? <p className="muted">Already have an account? <Link to="/login" state={{ from }}>Sign in</Link></p>
        : <p className="muted">New to Afterlight? <Link to="/register" state={{ from }}>Create an account</Link></p>}
    </section>
  </div></Page>
}

export function ProfilePage() {
  const { session, authorized, logout } = useAuth()
  const query = useQuery({
    queryKey: ['session', session?.id, 'profile'],
    enabled: !!session,
    queryFn: ({ signal }) => authorized<User>('/users/me', { signal }),
  })
  if (!session) return <Navigate to="/login" state={{ from: '/profile' }} replace />
  return <Page><div className="shell inner-page">
    <h1>Profile</h1>
    <div className="profile-card">
      <UserRound size={30} aria-hidden="true" />
      {query.isPending ? <p role="status">Loading profile…</p> : query.isError
        ? <ErrorState error={query.error} retry={() => void query.refetch()} />
        : <div><h2>{query.data.email}</h2><p className="muted">Member since {dateLabel(query.data.created_at)}</p></div>}
      <div className="button-group">
        <Link className="button secondary" to="/watchlist">My Watchlist</Link>
        <Link className="button secondary" to="/watched">Watched Movies</Link>
        <button className="button secondary" onClick={logout}><LogOut size={18} /> Sign out</button>
      </div>
    </div>
  </div></Page>
}
