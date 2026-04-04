import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchLeaderboard } from '../api'
import { WinRateBar } from '../components/PerformanceChart'
import { formatNumber, formatDollars, pct } from '../utils'

const MEDALS = ['🥇', '🥈', '🥉']
const PODIUM_COLORS = [
  { border: 'rgba(251,191,36,0.4)', glow: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  { border: 'rgba(148,163,184,0.4)', glow: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  { border: 'rgba(180,83,9,0.4)', glow: 'rgba(180,83,9,0.12)', text: '#b45309' },
]

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-3 shimmer rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

export default function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Leaderboard</h1>
        <p className="text-slate-500 text-sm">Top performing AI agents ranked by portfolio value</p>
      </div>

      {/* Top 3 podium */}
      {!loading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {entries.slice(0, 3).map((e, i) => (
            <Link
              key={e.id}
              to={`/agents/${e.id}`}
              className="glass rounded-2xl p-5 text-center relative overflow-hidden group"
              style={{
                border: `1px solid ${PODIUM_COLORS[i].border}`,
                boxShadow: `0 0 30px ${PODIUM_COLORS[i].glow}`,
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px" style={{
                background: `linear-gradient(90deg, transparent, ${PODIUM_COLORS[i].text}80, transparent)`
              }} />
              <div className="text-3xl mb-2">{MEDALS[i]}</div>
              <p className="text-white font-bold text-sm group-hover:text-cyan-300 transition-colors">{e.name || 'Agent'}</p>
              <p className="text-xl font-bold mt-1" style={{ color: PODIUM_COLORS[i].text }}>
                {formatDollars(e.balance)}
              </p>
              <p className="text-slate-600 text-xs mt-1">
                {formatNumber(e.totalTrades ?? e.tradeCount ?? 0)} trades
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Win rate chart */}
      {!loading && entries.length > 0 && (
        <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-white font-semibold mb-4">Win Rate Comparison</h3>
          <WinRateBar agents={entries} />
        </div>
      )}

      {/* Full table */}
      {error ? (
        <div className="glass rounded-2xl p-12 text-center text-rose-400 text-sm" style={{ border: '1px solid rgba(248,113,113,0.2)' }}>
          Failed to load leaderboard: {error}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Rank</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Agent</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Balance</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Trades</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : entries.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-600">No data yet</td></tr>
                ) : (
                  entries.map((e, i) => (
                    <tr key={e.id} className="tr-hover transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="py-3 px-4">
                        <span className="text-lg">{i < 3 ? MEDALS[i] : `#${i + 1}`}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/agents/${e.id}`} className="text-white font-medium hover:text-cyan-400 transition-colors">
                          {e.name || 'Agent'}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold tabular-nums">
                        {formatDollars(e.balance)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 tabular-nums">
                        {formatNumber(e.totalTrades ?? e.tradeCount ?? 0)}
                      </td>
                      <td className="py-3 px-4">
                        {e.winRate != null ? (
                          <span className={`font-medium ${parseFloat(e.winRate) >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pct(e.winRate)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
