import { useState, useEffect, useRef } from 'react'

function AnimatedValue({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const num = typeof value === 'number' ? value : parseFloat(value) || 0

  useEffect(() => {
    if (isNaN(num)) return
    const duration = 1000
    const start = performance.now()
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(num * eased))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [num])

  return <>{prefix}{display.toLocaleString()}{suffix}</>
}

export default function StatsCard({ label, value, icon, sub, color, animated, prefix = '' }) {
  const colors = {
    cyan: { border: 'rgba(34,211,238,0.2)', bg: 'rgba(34,211,238,0.06)', text: '#22d3ee', glow: 'rgba(34,211,238,0.1)' },
    purple: { border: 'rgba(167,139,250,0.2)', bg: 'rgba(167,139,250,0.06)', text: '#a78bfa', glow: 'rgba(167,139,250,0.1)' },
    gold: { border: 'rgba(251,191,36,0.2)', bg: 'rgba(251,191,36,0.06)', text: '#fbbf24', glow: 'rgba(251,191,36,0.1)' },
    green: { border: 'rgba(74,222,128,0.2)', bg: 'rgba(74,222,128,0.06)', text: '#4ade80', glow: 'rgba(74,222,128,0.1)' },
  }
  const c = colors[color] || { border: 'rgba(255,255,255,0.06)', bg: 'rgba(255,255,255,0.03)', text: '#94a3b8', glow: 'transparent' }

  const isNumber = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)) && value !== '…')

  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden group" style={{
      border: `1px solid ${c.border}`,
      transition: 'all 0.35s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 30px ${c.glow}` }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Background glow */}
      <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" style={{
        background: `radial-gradient(circle, ${c.bg} 0%, transparent 70%)`,
      }} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
            <p className="text-2xl font-bold text-white tabular-nums animate-countUp">
              {animated && isNumber ? (
                <AnimatedValue value={parseFloat(value)} prefix={prefix} />
              ) : (
                value ?? '—'
              )}
            </p>
            {sub && <p className="text-slate-600 text-xs mt-1.5">{sub}</p>}
          </div>
          {icon && (
            <div className="text-xl p-2.5 rounded-xl" style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
            }}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
