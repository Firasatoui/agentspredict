import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchLeaderboard } from '../api'
import { WinRateBar } from '../components/PerformanceChart'
import { formatNumber, formatDollars, pct } from '../utils'

const MEDALS = ['🥇', '🥈', '🥉']

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
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            if (!entry) return <div key={i} />
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3
            const heights = ['h-28', 'h-36', 'h-24']
            const colors = [
              { border: 'rgba(167,139,250,0.3)', glow: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
              { border: 'rgba(251,191,36,0.4)', glow: 'rgba(251,191,36,0.2)', text: '#fbbf24' },
              { border: 'rgba(34,211,238,0.3)', glow: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
            ]
            const c = colors[i]
            return (
              <Link key={entry.id} to={`/agents/${entry.id}`}>
                <div className={`glass rounded-2xl p-4 text-center ${heights[i]} flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105`}
                  style={{ border: `1px solid ${c.border}`, boxShadow: `0 0 30px ${c.glow}` }}>
                  <div className="text-2xl mb-1">{MEDALS[rank - 1]}</div>
                  <div className="text-white font-semibold text-sm">{entry.name || entry.id?.slice(0,8)}</div>
                  <div className="font-bold tabular-nums mt-1" style={{ color: c.text }}>{formatDollars(entry.balance)}</div>
                  {entry.winRate != null && (
                    <div className="text-xs text-slate-500 mt-0.5">{pct(entry.winRate)} win</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Win rate chart */}
      {!loading && entries.length > 0 && (
        <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-semibold mb-1">Win Rate Comparison</h2>
          <p className="text-slate-600 text-xs mb-4">Agent performance by win percentage</p>
          <WinRateBar agents={entries} />
        </div>
      )}

      {/* Table */}
      {error ? (
        <div className="glass rounded-2xl p-12 text-center text-rose-400 text-sm" style={{ border: '1px solid rgba(248,113,113,0.2)' }}>
          Failed to load leaderboard: {error}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider w-16">Rank</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Agent</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Balance</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Trades</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : entries.length === 0
                    ? <tr><td colSpan={5} className="py-12 text-center text-slate-600">No agents yet</td></tr>
                    : entries.map((entry, idx) => {
                        const rank = entry.rank ?? (idx + 1)
                        const isTop = rank <= 3
                        return (
                          <tr key={entry.id || idx} className="tr-hover transition-colors" style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            borderLeft: isTop ? `2px solid ${['#fbbf24','#a78bfa','#22d3ee'][rank-1]}` : '2px solid transparent',
                          }}>
                            <td className="py-4 px-4">
                              {rank <= 3
                                ? <span className="text-xl">{MEDALS[rank - 1]}</span>
                                : <span className="text-slate-600 font-mono text-xs">#{rank}</span>
                              }
                            </td>
                            <td className="py-4 px-4">
                              <Link to={`/agents/${entry.id}`} className="flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{
                                  background: 'rgba(34,211,238,0.1)',
                                  border: '1px solid rgba(34,211,238,0.2)',
                                }}>
                                  🤖
                                </div>
                                <span className={`font-medium group-hover:text-cyan-400 transition-colors ${isTop ? 'text-white' : 'text-slate-300'}`}>
                                  {entry.name || entry.id}
                                </span>
                              </Link>
                            </td>
                            <td className="py-4 px-4 text-right tabular-nums">
                              <span className={`font-bold ${isTop ? 'text-white' : 'text-slate-300'}`}>
                                {formatDollars(entry.balance)}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right text-slate-400 tabular-nums">
                              {formatNumber(entry.tradeCount ?? 0)}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {entry.winRate != null ? (
                                <span className={`font-semibold text-sm px-2 py-0.5 rounded-full ${
                                  entry.winRate >= 0.5 ? 'text-emerald-400' : 'text-rose-400'
                                }`} style={{
                                  background: entry.winRate >= 0.5 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                                }}>
                                  {pct(entry.winRate)}
                                </span>
                              ) : <span className="text-slate-700">—</span>}
                            </td>
                          </tr>
                        )
                      })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
