import { useQuery } from '@tanstack/react-query'
import { Bookmark, CalendarDays, Compass } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { movieOptions } from '../api/movies'
import { Backdrop, Poster } from '../components/movies/Artwork'
import { CollectionButton } from '../components/movies/CollectionButton'
import { RatingBadge } from '../components/movies/Movies'
import { ErrorState, LoadingSkeleton, Page } from '../components/ui/States'
import { useAuth } from '../contexts/Auth'
import { dateLabel } from '../utils/movies'
import { NotFoundPage } from './Discovery'

export function MovieDetails() {
  const { id = '' } = useParams()
  const movieId = Number(id)
  const valid = /^\d+$/.test(id) && movieId > 0 && movieId <= 2147483647
  const query = useQuery({ ...movieOptions(movieId), enabled: valid })
  const { session } = useAuth()
  const location = useLocation()

  if (!valid) return <NotFoundPage />
  if (query.isPending) return <LoadingSkeleton kind="hero" />
  if (query.isError) return <div className="shell inner-page"><h1>Movie details</h1>
    <ErrorState error={query.error} retry={() => void query.refetch()} /></div>
  const movie = query.data
  const releaseDate = dateLabel(movie.release_date)
  return <Page><article className="detail" aria-labelledby="movie-title">
    <div className="detail-art" aria-hidden="true">
      <Backdrop key={movie.id} backdrop={movie.backdrop_path} poster={movie.poster_path} />
    </div>
    <div className="shell detail-content">
      <Link className="detail-browse" to="/browse"><Compass size={17} aria-hidden="true" /> Browse movies</Link>
      <div className="detail-poster"><Poster path={movie.poster_path} eager /></div>
      <header className="detail-heading">
        <h1 id="movie-title">{movie.title}</h1>
        <div className="metadata">
          <RatingBadge rating={movie.vote_average} />
          {releaseDate && <time dateTime={movie.release_date}><CalendarDays size={16} aria-hidden="true" />{releaseDate}</time>}
        </div>
      </header>
      <div className="button-group detail-actions">
        {session ? <>
          <CollectionButton key={'watchlist-' + movie.id} collection="watchlist" id={movie.id} />
          <CollectionButton key={'watched-' + movie.id} collection="watched" id={movie.id} />
        </> : <Link className="button primary" to="/login" state={{ from: location.pathname }}>
          <Bookmark size={18} aria-hidden="true" /> Sign in to save
        </Link>}
      </div>
      <section className="detail-synopsis">
        <h2>Synopsis</h2>
        <p>{movie.overview || 'An overview is unavailable for this movie.'}</p>
      </section>
    </div>
  </article></Page>
}
