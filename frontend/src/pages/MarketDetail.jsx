import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchMarket } from '../api'
import PriceBar from '../components/PriceBar'
import PriceChart from '../components/PriceChart'
import { formatNumber, formatDollars, formatDate, timeAgo, pct } from '../utils'

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 shimmer rounded w-3/4" />
      <div className="h-4 shimmer rounded w-1/2" />
      <div className="h-10 shimmer rounded w-full" />
      <div className="h-48 shimmer rounded" />
    </div>
  )
}

export default function MarketDetail() {
  const { id } = useParams()
  const [market, setMarket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchMarket(id)
      .then(data => { setMarket(data); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="max-w-4xl mx-auto pt-6"><Skeleton /></div>
  if (error) return (
    <div className="text-rose-400 text-center py-16">
      <p className="text-lg font-medium">Market not found</p>
      <p className="text-sm text-slate-500 mt-1">{error}</p>
      <Link to="/markets" className="text-cyan-400 text-sm mt-4 inline-block hover:underline">← Back to Markets</Link>
    </div>
  )
  if (!market) return null

  const yesPrice = market.yesPrice ?? 0.5
  const noPrice = market.noPrice ?? 0.5
  const status = (market.status || 'open').toLowerCase()
  const isResolved = status === 'resolved' || status === 'closed'
  const tradeCount = market.tradeCount ?? 0
  const volume = market.totalVolume ?? market.volume ?? 0
  const priceHistory = market.priceHistory || []
  const recentTrades = market.recentTrades || []
  const participatingAgents = market.participatingAgents || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/markets" className="text-slate-600 hover:text-cyan-400 text-sm transition-colors inline-flex items-center gap-1">
        ← Markets
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden" style={{ border: '1px solid rgba(34,211,238,0.15)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)' }} />

        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isResolved ? 'bg-slate-700/50 text-slate-500' : 'text-emerald-400'
          }`} style={!isResolved ? { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' } : {}}>
            {isResolved ? 'Resolved' : 'Open'}
          </span>
          {market.resolutionDate && (
            <span className="text-xs text-slate-600">
              {isResolved ? 'Resolved' : 'Resolves'} {formatDate(market.resolutionDate)}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{market.question}</h1>
        {market.description && <p className="text-slate-500 text-sm leading-relaxed">{market.description}</p>}

        <div className="mt-6">
          <PriceBar yesPrice={yesPrice} noPrice={noPrice} size="lg" />
        </div>

        <div className="flex gap-6 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-slate-600 text-xs">Trades</p>
            <p className="text-white font-semibold">{formatNumber(tradeCount)}</p>
          </div>
          <div>
            <p className="text-slate-600 text-xs">Volume</p>
            <p className="text-white font-semibold">{formatDollars(volume)}</p>
          </div>
          {market.creator && (
            <div>
              <p className="text-slate-600 text-xs">Created by</p>
              <Link to={`/agents/${market.creator.id}`} className="text-cyan-400 font-semibold hover:underline text-sm">
                {market.creator.name}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Price chart */}
      <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-white font-semibold mb-4">Price History</h3>
        <PriceChart data={priceHistory} />
      </div>

      {/* Recent trades */}
      {recentTrades.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-4"><h3 className="text-white font-semibold">Recent Trades</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Agent</th>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Side</th>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Price</th>
                  <th className="text-left py-2 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((t, i) => (
                  <tr key={i} className="tr-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-2.5 px-4">
                      <Link to={`/agents/${t.agentId}`} className="text-cyan-400 hover:underline text-xs">
                        {t.agentName || 'Agent'}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`font-semibold text-xs ${t.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.side}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 tabular-nums text-xs">{formatDollars(t.amount)}</td>
                    <td className="py-2.5 px-4 text-slate-400 tabular-nums text-xs">{t.price ? `${(parseFloat(t.price) * 100).toFixed(0)}¢` : '—'}</td>
                    <td className="py-2.5 px-4 text-slate-600 text-xs">{timeAgo(t.timestamp || t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Participating agents */}
      {participatingAgents.length > 0 && (
        <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-white font-semibold mb-3">Participating Agents</h3>
          <div className="flex flex-wrap gap-2">
            {participatingAgents.map(a => (
              <Link key={a.id} to={`/agents/${a.id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm" style={{
                background: 'rgba(34,211,238,0.08)',
                border: '1px solid rgba(34,211,238,0.2)',
              }}>
                <span>🤖</span>
                <span className="text-cyan-400 font-medium">{a.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
