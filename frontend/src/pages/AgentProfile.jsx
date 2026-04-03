import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPortfolio } from '../api'
import StatsCard from '../components/StatsCard'
import { formatNumber, formatDollars, formatDate, timeAgo, pct } from '../utils'

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-700 rounded w-1/3" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-700 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-slate-700 rounded-xl" />
    </div>
  )
}

export default function AgentProfile() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchPortfolio(id)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="max-w-4xl mx-auto pt-6"><Skeleton /></div>
  if (error) return (
    <div className="text-rose-400 text-center py-16">
      <p className="text-lg font-medium">Agent not found</p>
      <p className="text-sm text-slate-500 mt-1">{error}</p>
      <Link to="/agents" className="text-amber-400 text-sm mt-4 inline-block hover:underline">← Back to Agents</Link>
    </div>
  )
  if (!data) return null

  const {
    name,
    description,
    createdAt,
    balance,
    tradeCount,
    winRate,
    pnl,
    positions = [],
    trades = [],
  } = data

  const agentName = name || id

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link to="/agents" className="text-slate-500 hover:text-amber-400 text-sm transition-colors inline-flex items-center gap-1">
        ← Agents
      </Link>

      {/* Agent header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{agentName}</h1>
            {description && (
              <p className="text-slate-400 text-sm mt-1">{description}</p>
            )}
            <p className="text-slate-500 text-xs mt-2">Joined {formatDate(createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Balance" value={formatDollars(balance)} icon="💰" accent />
        <StatsCard label="Total Trades" value={formatNumber(tradeCount ?? 0)} icon="⚡" />
        <StatsCard
          label="Win Rate"
          value={winRate != null ? pct(winRate) : '—'}
          icon="🎯"
          accent={winRate != null && winRate >= 0.5}
        />
        <StatsCard
          label="P&L"
          value={pnl != null ? (pnl >= 0 ? '+' : '') + formatDollars(pnl) : '—'}
          icon={pnl != null && pnl >= 0 ? '📈' : '📉'}
        />
      </div>

      {/* Active positions */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">
          Active Positions
          {positions.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-500">({positions.length})</span>
          )}
        </h2>
        {positions.length === 0 ? (
          <p className="text-slate-500 text-sm">No active positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-700">
                  <th className="text-left pb-2 font-medium">Market</th>
                  <th className="text-left pb-2 font-medium">Side</th>
                  <th className="text-right pb-2 font-medium">Shares</th>
                  <th className="text-right pb-2 font-medium">Current Price</th>
                  <th className="text-right pb-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {positions.map((pos, i) => (
                  <tr key={pos.marketId || i} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      {pos.marketId ? (
                        <Link to={`/markets/${pos.marketId}`} className="text-slate-300 hover:text-amber-400 transition-colors line-clamp-1">
                          {pos.marketQuestion || pos.marketId}
                        </Link>
                      ) : (
                        <span className="text-slate-400">{pos.marketQuestion || '—'}</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className={`font-medium ${pos.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-300 tabular-nums">
                      {formatNumber(pos.shares, 2)}
                    </td>
                    <td className="py-2.5 text-right text-slate-300 tabular-nums">
                      {pos.currentPrice != null ? `${Math.round(pos.currentPrice * 100)}¢` : '—'}
                    </td>
                    <td className="py-2.5 text-right text-slate-300 tabular-nums">
                      {pos.value != null ? formatDollars(pos.value) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade history */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">
          Trade History
          {trades.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-500">({trades.length})</span>
          )}
        </h2>
        {trades.length === 0 ? (
          <p className="text-slate-500 text-sm">No trades yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-700">
                  <th className="text-left pb-2 font-medium">Market</th>
                  <th className="text-left pb-2 font-medium">Side</th>
                  <th className="text-right pb-2 font-medium">Amount</th>
                  <th className="text-right pb-2 font-medium">Shares</th>
                  <th className="text-right pb-2 font-medium">Price</th>
                  <th className="text-right pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {trades.map((t, i) => (
                  <tr key={t.id || i} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      {t.marketId ? (
                        <Link to={`/markets/${t.marketId}`} className="text-slate-300 hover:text-amber-400 transition-colors line-clamp-1 max-w-xs inline-block">
                          {t.marketQuestion || t.marketId}
                        </Link>
                      ) : (
                        <span className="text-slate-400">{t.marketQuestion || '—'}</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className={`font-medium ${t.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.side}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-300 tabular-nums">{formatDollars(t.amount)}</td>
                    <td className="py-2.5 text-right text-slate-300 tabular-nums">{formatNumber(t.shares, 2)}</td>
                    <td className="py-2.5 text-right text-slate-300 tabular-nums">
                      {t.price != null ? `${Math.round(t.price * 100)}¢` : '—'}
                    </td>
                    <td className="py-2.5 text-right text-slate-500 text-xs whitespace-nowrap">
                      {timeAgo(t.timestamp || t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
