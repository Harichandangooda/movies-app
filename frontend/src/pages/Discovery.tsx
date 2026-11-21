import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { homeOptions } from '../api/movies'
import { useAuth } from '../contexts/Auth'
import { useCollection } from '../hooks/useCollection'
import type { Collection } from '../types/api'
import { HeroCarousel } from '../components/movies/HeroCarousel'
import { MovieGrid, MovieRow } from '../components/movies/Movies'
import { EmptyState, ErrorState, LoadingSkeleton, Page } from '../components/ui/States'

const shelves = [
  { key: 'popular', title: 'Popular Right Now', filter: 'Popular' },
  { key: 'now_playing', title: 'Now Playing in Theaters', filter: 'In Theaters' },
  { key: 'top_rated', title: 'Critically Acclaimed', filter: 'Top Rated' },
  { key: 'trending', title: 'Trending This Week', filter: 'Trending' },
] as const

function PersonalShelf({ collection, title }: { collection: Collection; title: string }) {
  const query = useCollection(collection)
  if (query.isError) return <section className="shelf"><h2>{title}</h2><ErrorState error={query.error} retry={() => void query.refetch()} /></section>
  return <MovieRow title={title} movies={query.data} loading={query.isPending} to={'/' + collection} />
}

export function HomePage() {
  const query = useQuery(homeOptions)
  const { session } = useAuth()
  return <>
    {query.isPending ? <LoadingSkeleton kind="hero" /> : query.isError
      ? <section className="hero hero-empty"><div className="hero-content">
        <h1>Discover movies</h1><ErrorState error={query.error} retry={() => void query.refetch()} />
      </div></section>
      : <HeroCarousel movies={query.data.trending ?? []} />}
    <div className="shell home-shelves">
      {!query.isError && shelves.slice(0, 3).map(({ key, title }) =>
        <MovieRow key={key} title={title} movies={query.data?.[key]} to={'/browse?collection=' + key} loading={query.isPending} />)}
      {session && <><PersonalShelf collection="watchlist" title="Your Watchlist" />
        <PersonalShelf collection="watched" title="Watch Again" /></>}
    </div>
  </>
}

export function BrowsePage() {
  const [params] = useSearchParams()
  const selected = shelves.find(item => item.key === params.get('collection')) ?? shelves[0]
  const query = useQuery(homeOptions)
  return <Page><div className="shell inner-page">
    <h1>Browse movies</h1>
    <nav className="filters" aria-label="Movie collections">{shelves.map(item =>
      <Link key={item.key} aria-current={selected.key === item.key ? 'page' : undefined}
        to={'/browse?collection=' + item.key}>{item.filter}</Link>)}</nav>
    {query.isPending ? <LoadingSkeleton /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} />
      : <MovieGrid movies={query.data[selected.key] ?? []} empty="No movies in this collection yet" />}
  </div></Page>
}

export function NotFoundPage() {
  return <div className="shell inner-page"><EmptyState title="Page not found">
    <Link className="button primary" to="/">Back to Home</Link>
  </EmptyState></div>
}
