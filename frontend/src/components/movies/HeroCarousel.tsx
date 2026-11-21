import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clapperboard, Info, Pause, Play } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/Auth'
import type { Movie } from '../../types/api'
import { movieYear } from '../../utils/movies'
import { Backdrop } from './Artwork'
import { CollectionButton } from './CollectionButton'
import { RatingBadge } from './Movies'

export function HeroCarousel({ movies }: { movies: Movie[] }) {
  const slides = movies.slice(0, 6)
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [touching, setTouching] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const reduced = useReducedMotion()
  const [autoplay, setAutoplay] = useState<boolean | null>(null)
  const rotating = autoplay ?? !reduced
  const active = index % (count || 1)
  const movie = slides[active]
  const { session } = useAuth()

  useEffect(() => {
    if (count < 2 || !rotating || hover || focus || touching) return
    const interval = window.setInterval(() => {
      if (!document.hidden) setIndex(current => (current + 1) % count)
    }, 6000)
    return () => window.clearInterval(interval)
  }, [count, rotating, hover, focus, touching])

  function select(next: number) {
    if (count < 2) return
    setAutoplay(false)
    setIndex((next + count) % count)
  }

  if (!movie) return <section className="hero hero-empty"><div className="hero-content">
    <h1>Explore Afterlight</h1><p>Trending movies will appear here when available.</p>
    <Link to="/browse" className="button primary">Browse movies</Link>
  </div></section>

  return <section className="hero" aria-roledescription="carousel" aria-label="Trending movies"
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onTouchStart={event => {
      const touch = event.touches[0]
      touchStart.current = touch && event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
      setTouching(true)
    }}
    onTouchCancel={() => { touchStart.current = null; setTouching(false) }}
    onTouchEnd={event => {
      const start = touchStart.current
      const touch = event.changedTouches[0]
      touchStart.current = null
      setTouching(false)
      if (!start || !touch) return
      const dx = touch.clientX - start.x
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(touch.clientY - start.y)) select(active + (dx < 0 ? 1 : -1))
    }}
    onFocus={() => setFocus(true)} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false)
    }}
    onKeyDown={event => {
      if (count < 2 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
      event.preventDefault()
      select(active + (event.key === 'ArrowLeft' ? -1 : 1))
    }}>
    <AnimatePresence>
      <motion.div className="hero-art" key={movie.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.55 }}>
        <Backdrop backdrop={movie.backdrop_path} poster={movie.poster_path} />
      </motion.div>
    </AnimatePresence>
    <div className="hero-shade" />
    <div className="hero-content" aria-live={rotating ? 'off' : 'polite'}>
      <motion.div key={movie.id} initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.35 }} className="hero-copy">
        <div className="hero-summary">
          <p className="eyebrow"><Clapperboard size={16} /> Trending this week</p>
          <h1>{movie.title}</h1>
          <div className="metadata">{movieYear(movie.release_date) && <span>{movieYear(movie.release_date)}</span>}
            <RatingBadge rating={movie.vote_average} />
          </div>
          {movie.overview && <p className="hero-overview">{movie.overview}</p>}
        </div>
        <div className="button-group">
          <Link className="button primary" to={'/movies/' + movie.id}><Info size={19} /> View Details</Link>
          {session && <CollectionButton id={movie.id} collection="watchlist" />}
        </div>
      </motion.div>
    </div>
    {count > 1 && <div className="hero-toolbar">
      <div className="hero-dots" aria-label="Choose a slide">
        {slides.map((slide, position) => <button key={slide.id} className="hero-dot" aria-label={slide.title}
          aria-current={active === position ? 'true' : undefined} onClick={() => select(position)}><span /></button>)}
        <button className="icon-button autoplay" aria-label={rotating ? 'Pause slideshow' : 'Play slideshow'}
          onClick={() => setAutoplay(!rotating)}>{rotating ? <Pause size={15} /> : <Play size={15} />}</button>
      </div>
      <div className="hero-arrows">
        <button className="icon-button" aria-label="Previous featured movie" onClick={() => select(active - 1)}><ChevronLeft /></button>
        <button className="icon-button" aria-label="Next featured movie" onClick={() => select(active + 1)}><ChevronRight /></button>
      </div>
    </div>}
  </section>
}
