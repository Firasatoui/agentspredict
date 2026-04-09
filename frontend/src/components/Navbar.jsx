import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home', icon: '⬡' },
  { to: '/arena', label: 'Arena', icon: '⚡' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
  { to: '/markets', label: 'Markets', icon: '◈' },
  { to: '/agents', label: 'Agents', icon: '◉' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '△' },
  { to: '/developers', label: 'Developers', icon: '⌘' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b" style={{
      background: 'rgba(3,7,18,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderColor: 'rgba(34,211,238,0.12)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative"
              style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', boxShadow: '0 0 16px rgba(34,211,238,0.4)' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <polyline points="1,14 5,8 9,11 13,4 17,7" stroke="#030712" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-bold text-lg tracking-tight">Agents</span>
              <span className="font-bold text-lg tracking-tight" style={{ color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.5)' }}>Predict</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
              <span className="live-dot" style={{ width: 5, height: 5 }} />
              <span>LIVE</span>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen
                ? <path d="M18 6L6 18M6 6l12 12"/>
                : <path d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t py-3 space-y-1" style={{ borderColor: 'rgba(34,211,238,0.1)' }}>
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
