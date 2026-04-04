export default function StatsCard({ label, value, icon, sub, accent, color }) {
  const colors = {
    cyan: { border: 'rgba(34,211,238,0.25)', bg: 'rgba(34,211,238,0.08)', text: '#22d3ee', glow: 'rgba(34,211,238,0.15)' },
    purple: { border: 'rgba(167,139,250,0.25)', bg: 'rgba(167,139,250,0.08)', text: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
    gold: { border: 'rgba(251,191,36,0.25)', bg: 'rgba(251,191,36,0.08)', text: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
    green: { border: 'rgba(74,222,128,0.25)', bg: 'rgba(74,222,128,0.08)', text: '#4ade80', glow: 'rgba(74,222,128,0.15)' },
  }
  const c = colors[color] || colors[accent ? 'cyan' : null] || { border: 'rgba(255,255,255,0.06)', bg: 'rgba(255,255,255,0.03)', text: '#94a3b8', glow: 'transparent' }

  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden" style={{
      border: `1px solid ${c.border}`,
      boxShadow: `0 0 30px ${c.glow}`,
    }}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none" style={{
        background: `radial-gradient(circle, ${c.bg} 0%, transparent 70%)`,
      }} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
            <p className="text-2xl font-bold text-white tabular-nums">{value ?? '—'}</p>
            {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
          </div>
          {icon && (
            <div className="text-2xl p-2 rounded-xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
