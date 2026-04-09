import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAgents } from '../api'
import { formatNumber, formatDollars, pct } from '../utils'

function strategyTag(name) {
  if (!name) return 'Unknown'
  const n = name.toLowerCase()
  if (n.includes('market') && n.includes('maker')) return 'Liquidity Provider'
  if (n.includes('trend')) return 'Momentum'
  if (n.includes('contrarian')) return 'Contrarian'
  if (n.includes('aggressive')) return 'High Risk'
  if (n.includes('conservative')) return 'Low Risk'
  if (n.includes('random')) return 'Random Baseline'
  return 'Custom'
}

const strategyColors = {
  'Liquidity Provider': '#22d3ee',
  'Momentum': '#a78bfa',
  'Contrarian': '#fbbf24',
  'High Risk': '#f87171',
  'Low Risk': '#4ade80',
  'Random Baseline': '#94a3b8',
  'Custom': '#60a5fa',
  'Unknown': '#64748b',
}

function ShimmerCard() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="shimmer w-14 h-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="shimmer h-5 w-2/3 rounded" />
          <div className="shimmer h-3 w-1/3 rounded" />
        </div>
      </div>
      <div className="shimmer h-16 w-full rounded-xl" />
    </div>
  )
}

export default function Agents() {
  const [agents, setAgents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('balance')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const sortedAgents = agents
    ? [...agents].sort((a, b) => {
        if (sortBy === 'balance') return (parseFloat(b.balance) || 0) - (parseFloat(a.balance) || 0)
        if (sortBy === 'trades') return (b.trade_count ?? b.tradeCount ?? 0) - (a.trade_count ?? a.tradeCount ?? 0)
        if (sortBy === 'winRate') return (b.win_rate ?? b.winRate ?? 0) - (a.win_rate ?? a.winRate ?? 0)
        return 0
      })
    : []

  return (
    <div className="animate-fadeInUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            ◉ <span className="gradient-text">Agents</span>
          </h1>
          <p className="text-slate-400">All registered autonomous trading agents.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer"
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <option value="balance">Balance</option>
            <option value="trades">Trades</option>
            <option value="winRate">Win Rate</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="glass rounded-xl p-4 mb-6" style={{ border: '1px solid rgba(248,113,113,0.3)' }}>
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Agent Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => <ShimmerCard key={i} />)}
        </div>
      ) : sortedAgents.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-slate-500">No agents found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedAgents.map((agent) => {
            const balance = parseFloat(agent.balance) || 0
            const pnl = balance - 1000
            const trades = agent.trade_count ?? agent.tradeCount ?? 0
            const winRate = agent.win_rate ?? agent.winRate ?? null
            const strat = strategyTag(agent.name)
            const stratColor = strategyColors[strat]
            const name = agent.name || `Agent ${agent.id}`

            return (
              <Link
                key={agent.id}
                to={`/agents/${agent.id}`}
                className="glass glass-hover rounded-2xl p-6 relative overflow-hidden block group"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{
                  background: `linear-gradient(90deg, transparent, ${stratColor}66, transparent)`,
                }} />
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none" style={{
                  background: `radial-gradient(circle, ${stratColor}08 0%, transparent 70%)`,
                }} />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 relative" style={{
                      background: `${stratColor}12`,
                      border: `2px solid ${stratColor}33`,
                      boxShadow: `0 0 20px ${stratColor}15`,
                    }}>
                      🤖
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate group-hover:text-cyan-50 transition-colors">{name}</h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1" style={{
                        background: `${stratColor}15`,
                        border: `1px solid ${stratColor}33`,
                        color: stratColor,
                      }}>
                        {strat}
                      </span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Balance</p>
                      <p className={`text-base font-bold tabular-nums ${balance >= 1000 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatDollars(balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Trades</p>
                      <p className="text-base font-bold text-white tabular-nums">{formatNumber(trades)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">P&L</p>
                      <p className={`text-base font-bold tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pnl >= 0 ? '+' : ''}{formatDollars(pnl)}
                      </p>
                    </div>
                  </div>

                  {/* Win Rate Bar */}
                  {winRate != null && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">Win Rate</span>
                        <span className={`font-semibold ${winRate >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pct(winRate)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${Math.min(100, (winRate * 100)).toFixed(0)}%`,
                          background: winRate >= 0.5
                            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                            : 'linear-gradient(90deg, #f87171, #ef4444)',
                          boxShadow: winRate >= 0.5 ? '0 0 8px rgba(74,222,128,0.4)' : '0 0 8px rgba(248,113,113,0.4)',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs text-slate-600">ID: {agent.id}</span>
                    <span className="text-xs font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                      View Profile <span>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
