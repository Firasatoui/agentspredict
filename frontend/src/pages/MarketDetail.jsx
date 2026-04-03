import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchMarket } from '../api'
import PriceBar from '../components/PriceBar'
import PriceChart from '../components/PriceChart'
import { formatNumber, formatDollars, formatDate, timeAgo, pct } from '../utils'

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 bg-slate-700 rounded w-3/4" />
      <div className="h-4 bg-slate-700 rounded w-1/2" />
      <div className="h-10 bg-slate-700 rounded w-full" />
      <div className="h-48 bg-slate-700 rounded" />
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
      <Link to="/markets" className="text-amber-400 text-sm mt-4 inline-block hover:underline">← Back to Markets</Link>
    </div>
  )
  if (!market) return null

  const {
    question,
    description,
    status,
    yesPrice,
    noPrice,
    tradeCount,
    volume,
    resolvesAt,
    createdAt,
    outcome,
    priceHistory = [],
    recentTrades = [],
    participatingAgents = [],
  } = market

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link to="/markets" className="text-slate-500 hover:text-amber-400 text-sm transition-colors inline-flex items-center gap-1">
        ← Markets
      </Link>

      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            status === 'resolved'
              ? 'bg-slate-700 text-slate-400'
              : 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'
          }`}>
            {status === 'resolved' ? 'Resolved' : 'Open'}
          </span>
          {outcome && (
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              outcome === 'YES'
                ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
                : 'bg-rose-900/50 text-rose-300 border border-rose-700'
            }`}>
              Outcome: {outcome}
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">{question}</h1>

        {description && (
          <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <p className="text-xs text-slate-500">Volume</p>
            <p className="text-white font-semibold">{formatDollars(volume)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Trades</p>
            <p className="text-white font-semibold">{formatNumber(tradeCount)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Created</p>
            <p className="text-white font-semibold">{formatDate(createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Resolves</p>
            <p className="text-white font-semibold">{formatDate(resolvesAt)}</p>
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Current Prices</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg p-4 text-center">
            <p className="text-emerald-400 text-xs font-medium uppercase tracking-wide mb-1">YES</p>
            <p className="text-3xl font-bold text-emerald-300">{Math.round((yesPrice ?? 0.5) * 100)}¢</p>
          </div>
          <div className="bg-rose-950/50 border border-rose-800 rounded-lg p-4 text-center">
            <p className="text-rose-400 text-xs font-medium uppercase tracking-wide mb-1">NO</p>
            <p className="text-3xl font-bold text-rose-300">{Math.round((noPrice ?? 0.5) * 100)}¢</p>
          </div>
        </div>
        <PriceBar yesPrice={yesPrice} noPrice={noPrice} size="lg" />
      </div>

      {/* Price chart */}
      {priceHistory.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Price History</h2>
          <PriceChart data={priceHistory} height={240} />
        </div>
      )}

      {/* Recent trades */}
      {recentTrades.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Recent Trades</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-700">
                  <th className="text-left pb-2 font-medium">Agent</th>
                  <th className="text-left pb-2 font-medium">Side</th>
                  <th className="text-right pb-2 font-medium">Amount</th>
                  <th className="text-right pb-2 font-medium">Shares</th>
                  <th className="text-right pb-2 font-medium">Price</th>
                  <th className="text-right pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {recentTrades.map((t, i) => (
                  <tr key={t.id || i} className="hover:bg-slate-750 transition-colors">
                    <td className="py-2 text-slate-300">
                      {t.agentId ? (
                        <Link to={`/agents/${t.agentId}`} className="hover:text-amber-400 transition-colors">
                          {t.agentName || t.agentId}
                        </Link>
                      ) : (
                        t.agentName || '—'
                      )}
                    </td>
                    <td className="py-2">
                      <span className={`font-medium ${t.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.side}
                      </span>
                    </td>
                    <td className="py-2 text-right text-slate-300">{formatDollars(t.amount)}</td>
                    <td className="py-2 text-right text-slate-300">{formatNumber(t.shares, 2)}</td>
                    <td className="py-2 text-right text-slate-300">{Math.round((t.price ?? 0) * 100)}¢</td>
                    <td className="py-2 text-right text-slate-500 text-xs">{timeAgo(t.timestamp || t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Participating agents */}
      {participatingAgents.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Participating Agents</h2>
          <div className="flex flex-wrap gap-2">
            {participatingAgents.map((a, i) => (
              <Link
                key={a.id || i}
                to={`/agents/${a.id}`}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                🤖 {a.name || a.id}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
