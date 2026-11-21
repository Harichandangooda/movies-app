import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MovieCardData } from '../../types/api'
import { movieYear } from '../../utils/movies'
import { EmptyState, LoadingSkeleton } from '../ui/States'
import { Poster } from './Artwork'

export function RatingBadge({ rating }: { rating: number }) {
  if (!Number.isFinite(rating) || rating <= 0) return null
  return <span className="rating" aria-label={`TMDB rating ${rating.toFixed(1)} out of 10`}>
    <Star size={14} fill="currentColor" aria-hidden="true" /> {rating.toFixed(1)}
  </span>
}

export function MovieCard({ movie, action }: { movie: MovieCardData; action?: ReactNode }) {
  return <article className="movie-card">
    <Link to={'/movies/' + movie.id} className="card-link">
      <div className="poster-frame"><Poster path={movie.poster_path} /><RatingBadge rating={movie.vote_average} /></div>
      <h3>{movie.title || 'Untitled movie'}</h3>
      {movieYear(movie.release_date) && <p>{movieYear(movie.release_date)}</p>}
    </Link>
    {action}
  </article>
}

export function MovieRow({ title, movies, to, loading }: {
  title: string; movies?: MovieCardData[] | null; to?: string; loading?: boolean
}) {
  const row = useRef<HTMLDivElement>(null)
  const heading = useId()
  const rowId = useId()
  const [edges, setEdges] = useState({ left: false, right: false })

  useEffect(() => {
    const element = row.current
    if (!element) {
      setEdges({ left: false, right: false })
      return
    }
    function update() {
      if (!element) return
      const maximum = element.scrollWidth - element.clientWidth
      const left = element.scrollLeft > 1
      const right = maximum - element.scrollLeft > 1
      setEdges(previous => previous.left === left && previous.right === right ? previous : { left, right })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    element.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      element.removeEventListener('scroll', update)
    }
  }, [movies?.length, loading])

  function scroll(direction: number) {
    const element = row.current
    if (!element) return
    const card = element.firstElementChild
    if (!card) return
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0
    const step = card.getBoundingClientRect().width + gap
    if (step <= 0) return
    element.scrollBy({
      left: Math.max(1, Math.floor(element.clientWidth / step)) * step * direction,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }
  return <section className="shelf" aria-labelledby={heading}>
    <div className="section-heading">
      <h2 id={heading}>{title}</h2>
      <div className="row-actions">
        {to && <Link className="text-link" to={to}>View all</Link>}
        {!!movies?.length && <div className="row-arrows">
          <button className="icon-button" aria-controls={rowId} aria-disabled={!edges.left} onClick={() => edges.left && scroll(-1)} aria-label={'Scroll ' + title + ' left'}><ChevronLeft size={19} /></button>
          <button className="icon-button" aria-controls={rowId} aria-disabled={!edges.right} onClick={() => edges.right && scroll(1)} aria-label={'Scroll ' + title + ' right'}><ChevronRight size={19} /></button>
        </div>}
      </div>
    </div>
    {loading ? <LoadingSkeleton kind="row" /> : movies?.length
      ? <div className="movie-row" id={rowId} ref={row} tabIndex={0} role="group" aria-labelledby={heading}>
        {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
      </div>
      : <p className="muted">No movies in this collection yet.</p>}
  </section>
}

export function MovieGrid<T extends MovieCardData>({ movies, empty = 'No movies found', action }: {
  movies: T[]; empty?: string; action?: (movie: T) => ReactNode
}) {
  if (!movies.length) return <EmptyState title={empty} />
  return <div className="movie-grid">{movies.map(movie =>
    <MovieCard key={movie.id} movie={movie} action={action?.(movie)} />)}</div>
}
