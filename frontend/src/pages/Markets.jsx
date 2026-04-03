import { useState, useEffect } from 'react'
import { fetchMarkets } from '../api'
import MarketCard from '../components/MarketCard'

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
]

function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 animate-pulse">
      <div className="h-3 bg-slate-700 rounded w-1/4 mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-700 rounded w-4/5" />
      </div>
      <div className="h-2.5 bg-slate-700 rounded-full mb-2" />
      <div className="flex justify-between">
        <div className="h-3 bg-slate-700 rounded w-1/4" />
        <div className="h-3 bg-slate-700 rounded w-1/4" />
      </div>
    </div>
  )
}

export default function Markets() {
  const [status, setStatus] = useState('')
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchMarkets(status || undefined)
      .then(data => {
        setMarkets(Array.isArray(data) ? data : [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Prediction Markets</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? 'Loading…' : `${markets.length} market${markets.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                status === f.key
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-rose-400 text-sm text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          Failed to load markets: {error}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : markets.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          No {status || ''} markets found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map(m => <MarketCard key={m.id} market={m} />)}
        </div>
      )}
    </div>
  )
}
