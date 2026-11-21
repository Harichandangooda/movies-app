import { useEffect, useId, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Film, Search, UserRound, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { searchOptions } from '../../api/movies'
import type { SearchResult } from '../../types/api'
import { imageUrl } from '../../utils/movies'

function ResultLabel({ result }: { result: SearchResult }) {
  const person = result.media_type === 'person'
  const src = imageUrl(person ? result.profile_path : result.poster_path, 'w342')
  const [failed, setFailed] = useState(false)
  const Icon = person ? UserRound : Film
  return <>
    <span className="search-result-image">
      {src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <Icon size={18} aria-hidden="true" />}
    </span>
    <span><strong>{person ? result.name : result.title}</strong>
      <small>{person ? (result.known_for_department === 'Acting' ? 'Actor' : result.known_for_department || 'Person') : 'Movie'}</small>
    </span>
  </>
}

export function NavSearch({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [debounced, setDebounced] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const trimmed = value.trim()
  const valid = Array.from(trimmed).length >= 3
  const waiting = trimmed !== debounced
  const query = useQuery({ ...searchOptions(debounced, 1), enabled: open && valid && !waiting })
  const results = query.data?.results ?? []
  const movies = results.filter(result => result.media_type === 'movie').slice(0, 4)
  const people = results.filter(result => result.media_type === 'person').slice(0, 4)
  const searchUrl = '/search?' + new URLSearchParams({ q: trimmed })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(trimmed), 300)
    return () => window.clearTimeout(timer)
  }, [trimmed])

  useEffect(() => { setOpen(false) }, [location.key])
  useEffect(() => {
    if (!open) return
    if (mobile) input.current?.focus()
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [mobile, open])

  function close() {
    if (mobile) trigger.current?.focus()
    else input.current?.focus()
    setOpen(false)
  }

  return <div ref={root} className={`nav-search-root ${mobile ? 'mobile-search' : ''} ${open ? 'search-open' : ''}`}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
    onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.stopPropagation(); close() }
    }}>
    {mobile && <button ref={trigger} type="button" className="icon-button" aria-label="Search movies and actors"
      aria-expanded={open} onClick={() => setOpen(!open)}><Search size={22} /></button>}
    {(!mobile || open) && <div className="nav-search-inner">
      <form className="nav-search" role="search" onSubmit={event => {
        event.preventDefault()
        if (valid) { setOpen(false); navigate(searchUrl) }
      }}>
        <input ref={input} type="search" aria-label="Search movies and actors" aria-controls={open ? panelId : undefined}
          placeholder="Search movies and actors" value={value} onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
          onChange={event => { setValue(event.target.value); setOpen(true) }} />
        {mobile && <button type="button" aria-label="Close search" onClick={close}><X size={19} /></button>}
        <button type="submit" aria-label="View movie search results"><Search size={18} /></button>
      </form>
      {open && <div className="search-dropdown" id={panelId}>
        {!valid ? <p role="status">Enter at least 3 characters to search.</p>
          : waiting || query.isPending ? <p role="status">Searching…</p>
          : query.isError ? <p role="alert">Search is unavailable. <button type="button" onClick={() => void query.refetch()}>Try again</button></p>
          : <>
            {!movies.length && !people.length && <p role="status">No movies or people found.</p>}
            {!!movies.length && <section aria-label="Movies"><h2>Movies</h2>
              {movies.map(movie => <Link className="search-result" to={'/movies/' + movie.id} key={movie.id} onClick={() => setOpen(false)}>
                <ResultLabel result={movie} />
              </Link>)}
            </section>}
            {!!people.length && <section aria-label="People"><h2>People</h2>
              {people.map(person => <details className="search-person" key={person.id}>
                <summary className="search-result"><ResultLabel result={person} /></summary>
                <p>{person.overview || (person.known_for_department ? 'Known for ' + person.known_for_department : 'No additional profile information available.')}</p>
              </details>)}
            </section>}
            {!!movies.length && <Link className="search-all" to={searchUrl} onClick={() => setOpen(false)}>View all movie results</Link>}
          </>}
      </div>}
    </div>}
  </div>
}
