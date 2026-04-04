import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPortfolio } from '../api'
import StatsCard from '../components/StatsCard'
import { PnlSparkline } from '../components/PerformanceChart'
import { formatNumber, formatDollars, formatDate, timeAgo, pct } from '../utils'

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 shimmer rounded w-1/3" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 shimmer rounded-2xl" />
        ))}
      </div>
      <div className="h-48 shimmer rounded-2xl" />
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
      <p className="text-sm text-slate-600 mt-1">{error}</p>
      <Link to="/agents" className="text-cyan-400 text-sm mt-4 inline-block hover:underline">← Back to Agents</Link>
    </div>
  )
  if (!data) return null

  const { name, description, createdAt, balance, tradeCount, winRate, pnl, positions = [], trades = [] } = data
  const agentName = name || id

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/agents" className="text-slate-600 hover:text-cyan-400 text-sm transition-colors inline-flex items-center gap-1">
        ← Agents
      </Link>

      {/* Agent header */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden" style={{ border: '1px solid rgba(34,211,238,0.15)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)' }} />
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.25)',
            boxShadow: '0 0 20px rgba(34,211,238,0.1)',
          }}>
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{agentName}</h1>
            {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-600 text-xs font-mono">Joined {formatDate(createdAt)}</p>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4ade80' }}>
                <span className="live-dot" style={{ width: 5, height: 5 }} />
                Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Balance" value={formatDollars(balance)} icon="💰" color="cyan" />
        <StatsCard label="Total Trades" value={formatNumber(tradeCount ?? 0)} icon="⚡" color="purple" />
        <StatsCard label="Win Rate" value={winRate != null ? pct(winRate) : '—'} icon="🎯" color={winRate != null && winRate >= 0.5 ? 'green' : 'gold'} />
        <StatsCard label="P&L" value={pnl != null ? (pnl >= 0 ? '+' : '') + formatDollars(pnl) : '—'} icon={pnl != null && pnl >= 0 ? '📈' : '📉'} color={pnl != null && pnl >= 0 ? 'green' : null} />
      </div>

      {/* P&L Chart */}
      {trades.length > 0 && (
        <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-semibold mb-1">Cumulative P&L</h2>
          <p className="text-slate-600 text-xs mb-4">Estimated running profit/loss from trade history</p>
          <PnlSparkline trades={trades} />
        </div>
      )}

      {/* Active positions */}
      <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-white font-semibold mb-4">
          Active Positions
          {positions.length > 0 && <span className="ml-2 text-xs text-slate-600">({positions.length})</span>}
        </h2>
        {positions.length === 0 ? (
          <p className="text-slate-600 text-sm">No active positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-600 uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left pb-3 font-medium">Market</th>
                  <th className="text-left pb-3 font-medium">Side</th>
                  <th className="text-right pb-3 font-medium">Shares</th>
                  <th className="text-right pb-3 font-medium">Price</th>
                  <th className="text-right pb-3 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, i) => (
                  <tr key={pos.marketId || i} className="tr-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-3 pr-4">
                      {pos.marketId ? (
                        <Link to={`/markets/${pos.marketId}`} className="text-slate-300 hover:text-cyan-400 transition-colors line-clamp-1">
                          {pos.marketQuestion || pos.marketId}
                        </Link>
                      ) : <span className="text-slate-500">{pos.marketQuestion || '—'}</span>}
                    </td>
                    <td className="py-3">
                      <span className={`font-semibold text-xs px-2 py-1 rounded-full ${pos.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}
                        style={{ background: pos.side === 'YES' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)' }}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-300 tabular-nums">{formatNumber(pos.shares, 2)}</td>
                    <td className="py-3 text-right text-slate-300 tabular-nums">{pos.currentPrice != null ? `${Math.round(pos.currentPrice * 100)}¢` : '—'}</td>
                    <td className="py-3 text-right text-slate-300 tabular-nums">{pos.value != null ? formatDollars(pos.value) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade history */}
      <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-white font-semibold mb-4">
          Trade History
          {trades.length > 0 && <span className="ml-2 text-xs text-slate-600">({trades.length})</span>}
        </h2>
        {trades.length === 0 ? (
          <p className="text-slate-600 text-sm">No trades yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-600 uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left pb-3 font-medium">Market</th>
                  <th className="text-left pb-3 font-medium">Side</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                  <th className="text-right pb-3 font-medium">Shares</th>
                  <th className="text-right pb-3 font-medium">Price</th>
                  <th className="text-right pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.id || i} className="tr-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-3 pr-4">
                      {t.marketId ? (
                        <Link to={`/markets/${t.marketId}`} className="text-slate-300 hover:text-cyan-400 transition-colors line-clamp-1 max-w-xs inline-block">
                          {t.marketQuestion || t.marketId}
                        </Link>
                      ) : <span className="text-slate-500">{t.marketQuestion || '—'}</span>}
                    </td>
                    <td className="py-3">
                      <span className={`font-semibold text-xs px-2 py-1 rounded-full ${t.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}
                        style={{ background: t.side === 'YES' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)' }}>
                        {t.side}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-300 tabular-nums">{formatDollars(t.amount)}</td>
                    <td className="py-3 text-right text-slate-300 tabular-nums">{formatNumber(t.shares, 2)}</td>
                    <td className="py-3 text-right text-slate-300 tabular-nums">{t.price != null ? `${Math.round(t.price * 100)}¢` : '—'}</td>
                    <td className="py-3 text-right text-slate-600 text-xs whitespace-nowrap">{timeAgo(t.timestamp || t.createdAt)}</td>
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
