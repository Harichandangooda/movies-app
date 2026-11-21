import { useEffect, useState } from 'react'
import { Bookmark, Clapperboard, Compass, Home, UserRound } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/Auth'
import { NavSearch } from './NavSearch'

export function Brand() {
  return <Link to="/" className="brand" aria-label="Afterlight home"><span><Clapperboard size={21} /></span>Afterlight<i>.</i></Link>
}

export function Navbar() {
  const { session } = useAuth()
  const [scrolled, setScrolled] = useState(() => window.scrollY > 12)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return <header className={'navbar' + (scrolled ? ' navbar-scrolled' : '')}>
    <div className="nav-inner">
      <Brand />
      <nav className="desktop-nav" aria-label="Main navigation">
        <NavLink to="/" end>Home</NavLink><NavLink to="/browse">Browse</NavLink>
        <NavLink to="/watchlist">My Watchlist</NavLink><NavLink to="/watched">Watched</NavLink>
      </nav>
      <div className="desktop-account">
        <NavSearch />
        {session ? <NavLink to="/profile" className="account-link"><UserRound size={18} /> Profile</NavLink>
          : <Link to="/login" className="account-link">Sign in</Link>}
      </div>
      <NavSearch mobile />
    </div>
  </header>
}

const mobileLinks = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/browse', label: 'Browse', Icon: Compass },
  { to: '/watchlist', label: 'Watchlist', Icon: Bookmark },
  { to: '/profile', label: 'Profile', Icon: UserRound },
]

export function MobileBottomNav() {
  return <nav className="mobile-nav" aria-label="Mobile navigation">
    {mobileLinks.map(({ to, label, Icon }) => <NavLink end={to === '/'} key={to} to={to}>
      <Icon size={21} aria-hidden="true" />{label}
    </NavLink>)}
  </nav>
}
