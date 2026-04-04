import { useState, useEffect } from 'react'
import { fetchMarkets } from '../api'
import MarketCard from '../components/MarketCard'

const TABS = [
  { key: 'local', label: 'AgentsPredict', icon: '◈' },
  { key: 'polymarket', label: 'Polymarket', icon: '⬡' },
  { key: 'kalshi', label: 'Kalshi', icon: '◉' },
]

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
]

function SkeletonCard() {
  return <div className="glass rounded-2xl p-5 h-44 shimmer" style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
}

function ExternalMarketCard({ market, source }) {
  return <MarketCard market={market} external externalUrl={market.url} source={source} />
}

export default function Markets() {
  const [tab, setTab] = useState('local')
  const [status, setStatus] = useState('open')
  const [localMarkets, setLocalMarkets] = useState([])
  const [polyMarkets, setPolyMarkets] = useState([])
  const [kalshiMarkets, setKalshiMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [externalLoading, setExternalLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchMarkets(status || undefined)
      .then(data => setLocalMarkets(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    if (tab === 'polymarket' && polyMarkets.length === 0) {
      setExternalLoading(true)
      fetch('/api/external/polymarket')
        .then(r => r.json())
        .then(data => {
          const markets = Array.isArray(data) ? data : (data.markets || [])
          setPolyMarkets(markets.map(m => ({
            id: m.id || m.conditionId,
            question: m.question || m.title,
            yesPrice: m.lastTradePrice ?? m.outcomePrices?.[0] ?? 0.5,
            noPrice: 1 - (m.lastTradePrice ?? m.outcomePrices?.[0] ?? 0.5),
            volume: m.volume ?? m.volumeNum ?? 0,
            tradeCount: m.tradesCount ?? 0,
            resolvesAt: m.endDateIso ?? m.endDate,
            status: m.closed ? 'resolved' : 'open',
            url: `https://polymarket.com/event/${m.slug || m.id}`,
          })))
        })
        .catch(() => {})
        .finally(() => setExternalLoading(false))
    }
    if (tab === 'kalshi' && kalshiMarkets.length === 0) {
      setExternalLoading(true)
      fetch('/api/external/kalshi')
        .then(r => r.json())
        .then(data => {
          const markets = Array.isArray(data) ? data : (data.markets || [])
          setKalshiMarkets(markets.map(m => ({
            id: m.ticker || m.id,
            question: m.title || m.question,
            yesPrice: (m.yes_ask ?? m.last_price ?? 50) / 100,
            noPrice: (m.no_ask ?? (100 - (m.last_price ?? 50))) / 100,
            volume: (m.volume ?? 0),
            tradeCount: m.volume ?? 0,
            resolvesAt: m.close_time ?? m.expiration_time,
            status: m.status === 'closed' ? 'resolved' : 'open',
            url: `https://kalshi.com/markets/${m.ticker || m.id}`,
          })))
        })
        .catch(() => {})
        .finally(() => setExternalLoading(false))
    }
  }, [tab])

  const currentMarkets = tab === 'local' ? localMarkets : tab === 'polymarket' ? polyMarkets : kalshiMarkets
  const isLoading = tab === 'local' ? loading : externalLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Prediction Markets</h1>
        <p className="text-slate-500 text-sm">Browse markets from AgentsPredict, Polymarket, and Kalshi</p>
      </div>

      {/* Source tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={tab === t.key ? {
              background: 'rgba(34,211,238,0.12)',
              border: '1px solid rgba(34,211,238,0.4)',
              color: '#22d3ee',
            } : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#64748b',
            }}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.key === 'polymarket' && <span className="text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>LIVE</span>}
            {t.key === 'kalshi' && <span className="text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>LIVE</span>}
          </button>
        ))}

        {tab === 'local' && (
          <div className="flex gap-1 ml-auto glass rounded-xl p-1" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={status === f.key ? {
                  background: 'rgba(34,211,238,0.15)',
                  color: '#22d3ee',
                } : { color: '#64748b' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Market count */}
      <div className="text-slate-600 text-sm font-mono">
        {isLoading ? 'Loading markets...' : `${currentMarkets.length} market${currentMarkets.length !== 1 ? 's' : ''} found`}
      </div>

      {/* External market notice */}
      {(tab === 'polymarket' || tab === 'kalshi') && !isLoading && currentMarkets.length > 0 && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl" style={{
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.15)',
          color: '#fbbf24',
        }}>
          <span>↗</span>
          These are live markets from {tab === 'polymarket' ? 'Polymarket' : 'Kalshi'}. Clicking a card opens it on their platform.
        </div>
      )}

      {error ? (
        <div className="glass rounded-2xl p-12 text-center text-rose-400 text-sm" style={{ border: '1px solid rgba(248,113,113,0.2)' }}>
          Failed to load markets: {error}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : currentMarkets.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-slate-600 text-sm">
            {tab === 'local' ? `No ${status || ''} markets found` : `Could not load ${tab} markets. They may be temporarily unavailable.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentMarkets.map((m, i) => (
            tab === 'local'
              ? <MarketCard key={m.id} market={m} />
              : <ExternalMarketCard key={m.id || i} market={m} source={tab} />
          ))}
        </div>
      )}
    </div>
  )
}
