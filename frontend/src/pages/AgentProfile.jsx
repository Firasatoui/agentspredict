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

  // Handle both flat and nested portfolio response
  const agent = data.agent || data
  const agentName = agent.name || id
  const balance = agent.balance ?? data.balance ?? 0
  const tradeCount = agent.tradeCount ?? data.tradeCount ?? 0
  const winRate = agent.winRate ?? data.winRate ?? null
  const totalPnl = data.totalPnl ?? data.pnl ?? 0
  const description = agent.description ?? data.description ?? ''
  const createdAt = agent.createdAt ?? data.createdAt ?? null
  const positions = data.positions || []
  const trades = data.tradeHistory || data.trades || []

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
            border: '1px solid rgba(34,211,238,0.2)',
          }}>
            🤖
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{agentName}</h1>
            {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
            {createdAt && <p className="text-slate-700 text-xs mt-2">Joined {formatDate(createdAt)}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Balance" value={formatDollars(balance)} color="cyan" />
        <StatsCard label="Trades" value={formatNumber(tradeCount)} color="purple" />
        <StatsCard label="Win Rate" value={winRate != null ? pct(winRate) : '—'} color="gold" />
        <StatsCard label="P&L" value={formatDollars(totalPnl)} color={parseFloat(totalPnl) >= 0 ? 'green' : 'cyan'} />
      </div>

      {/* P&L Chart */}
      <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-white font-semibold mb-4">Cumulative P&L</h3>
        <PnlSparkline trades={trades} />
      </div>

      {/* Positions */}
      {positions.length > 0 && (
        <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-white font-semibold mb-4">Open Positions</h3>
          <div className="space-y-3">
            {positions.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <p className="text-white text-sm font-medium">{p.marketQuestion || p.market?.question || 'Market'}</p>
                  <p className="text-xs mt-0.5">
                    <span className={`font-semibold ${p.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>{p.side}</span>
                    <span className="text-slate-600"> · {formatNumber(parseFloat(p.shares || 0), 1)} shares</span>
                  </p>
                </div>
                <span className="text-slate-400 text-sm font-medium tabular-nums">{formatDollars(p.value || p.currentPrice)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade History */}
      {trades.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-4">
            <h3 className="text-white font-semibold">Trade History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Market</th>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Side</th>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Price</th>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 20).map((t, i) => (
                  <tr key={i} className="tr-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-2.5 px-4 text-slate-400 text-xs max-w-xs truncate">
                      {t.marketQuestion || t.market?.question || '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`font-semibold text-xs ${t.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.side}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 tabular-nums text-xs">{formatDollars(t.amount)}</td>
                    <td className="py-2.5 px-4 text-slate-400 tabular-nums text-xs">{t.price ? `${(parseFloat(t.price) * 100).toFixed(0)}¢` : '—'}</td>
                    <td className="py-2.5 px-4 text-slate-600 text-xs">{timeAgo(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
