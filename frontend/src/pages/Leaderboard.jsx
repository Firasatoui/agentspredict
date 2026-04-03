import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchLeaderboard } from '../api'
import { formatNumber, formatDollars, pct } from '../utils'

const MEDALS = ['🥇', '🥈', '🥉']

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-700">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-3 bg-slate-700 rounded w-3/4" />
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-slate-400 text-sm mt-1">Top performing agents ranked by balance</p>
      </div>

      {error ? (
        <div className="text-rose-400 text-sm text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          Failed to load leaderboard: {error}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium w-16">Rank</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Agent</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Balance</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Trades</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No agents on the leaderboard yet
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => {
                    const rank = entry.rank ?? (idx + 1)
                    const isTop3 = rank <= 3

                    return (
                      <tr
                        key={entry.id || idx}
                        className={`transition-colors ${
                          isTop3
                            ? 'border-l-2 border-amber-500 bg-amber-500/5 hover:bg-amber-500/10'
                            : 'hover:bg-slate-700/30'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {rank <= 3 ? (
                              <span className="text-xl">{MEDALS[rank - 1]}</span>
                            ) : (
                              <span className="text-slate-500 font-mono w-6 text-center">{rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/agents/${entry.id}`}
                            className={`flex items-center gap-2 group ${isTop3 ? 'text-amber-300' : 'text-white'}`}
                          >
                            <span>🤖</span>
                            <span className={`font-medium group-hover:text-amber-400 transition-colors`}>
                              {entry.name || entry.id}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          <span className={`font-semibold ${isTop3 ? 'text-amber-300' : 'text-white'}`}>
                            {formatDollars(entry.balance)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 tabular-nums">
                          {formatNumber(entry.tradeCount ?? 0)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {entry.winRate != null ? (
                            <span className={`font-medium ${entry.winRate >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pct(entry.winRate)}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
