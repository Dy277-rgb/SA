import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Plane, Menu, X, User, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Flights' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-light/20 bg-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black">
              <img src="/LOgo.png" alt="SkyLane logo" className="h-9 w-9 rounded-full object-cover" />
          </span>
          Legendry Air Line
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-sunrise' : 'text-white/80 hover:text-white'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <>
              <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-white/90 hover:text-white">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-sunrise px-4 py-2 text-sm font-semibold text-navy transition hover:bg-sunrise-dark hover:text-white"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <User size={16} />
                )}
                {user.name}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl bg-white py-1 shadow-card">
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-mist"
                  >
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-mist"
                  >
                    <Settings size={15} /> Edit profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-mist"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="text-white md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-navy px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                {l.label}
              </NavLink>
            ))}
            {!user ? (
              <div className="mt-2 flex gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-white/10 py-2 text-center text-sm font-semibold text-white">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-sunrise py-2 text-center text-sm font-semibold text-navy">
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-1">
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10">
                  Dashboard
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10">
                  Edit profile
                </Link>
                <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-white/10">
                  Log out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
