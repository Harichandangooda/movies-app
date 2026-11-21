import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { searchOptions } from '../api/movies'
import { MovieGrid } from '../components/movies/Movies'
import { ErrorState, LoadingSkeleton, Page } from '../components/ui/States'
import { movieResults } from '../utils/movies'

function SearchResults({ initial, setUrl }: { initial: string; setUrl: (value: string) => void }) {
  const [value, setValue] = useState(initial)
  const [debounced, setDebounced] = useState(initial.trim())
  const [page, setPage] = useState(1)
  const trimmed = value.trim()
  const valid = Array.from(trimmed).length >= 3
  const waiting = trimmed !== debounced
  useEffect(() => {
    const timer = window.setTimeout(() => { setDebounced(trimmed); setPage(1) }, 320)
    return () => window.clearTimeout(timer)
  }, [trimmed])

  const query = useQuery({ ...searchOptions(debounced, page), enabled: valid && !waiting })
  const lastPage = Math.min(500, query.data?.total_pages ?? 0)
  return <>
    <form className="search-field" role="search" onSubmit={event => {
      event.preventDefault()
      if (trimmed !== initial) setUrl(trimmed)
      else { setDebounced(trimmed); setPage(1) }
    }}>
      <SearchIcon aria-hidden="true" size={22} />
      <input type="search" value={value} onChange={event => setValue(event.target.value)}
        placeholder="Search by movie title" aria-label="Search by movie title" />
      <button type="submit" className="button primary">Search</button>
    </form>
    {!valid ? <p className="muted">Enter at least 3 characters to search.</p> : waiting || query.isPending
      ? <LoadingSkeleton /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} />
      : <>
        <MovieGrid movies={movieResults(query.data.results)} empty={lastPage > 1 ? 'No movie matches on this page' : 'No movies found'} />
        {lastPage > 1 && <div className="pagination">
          <button className="button secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {lastPage}</span>
          <button className="button secondary" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>Next</button>
        </div>}
      </>}
  </>
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('q') ?? ''
  return <Page><section className="shell inner-page">
    <h1>Find a movie</h1>
    <SearchResults key={initial} initial={initial} setUrl={query => setParams(query ? { q: query } : {})} />
  </section></Page>
}
