import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Brand, MobileBottomNav, Navbar } from './components/layout/Navigation'
import { AuthPage, PersonalPage, ProfilePage } from './pages/Account'
import { BrowsePage, HomePage, NotFoundPage } from './pages/Discovery'
import { MovieDetails } from './pages/MovieDetails'
import { SearchPage } from './pages/Search'

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return <>
    <a className="skip" href="#main">Skip to content</a>
    <Navbar />
    <main id="main" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<AuthPage key="login" />} />
        <Route path="/register" element={<AuthPage key="register" register />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/watchlist" element={<PersonalPage collection="watchlist" />} />
        <Route path="/watched" element={<PersonalPage collection="watched" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
    <footer className="shell footer">
      <Brand />
      <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </footer>
    <MobileBottomNav />
  </>
}
