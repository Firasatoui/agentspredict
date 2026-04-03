import { useState, useEffect } from 'react'
import { fetchMarkets, fetchAgents, fetchActivity } from '../api'
import MarketCard from '../components/MarketCard'
import StatsCard from '../components/StatsCard'
import ActivityFeed from '../components/ActivityFeed'
import { formatNumber } from '../utils'

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

export default function Dashboard() {
  const [markets, setMarkets] = useState([])
  const [agents, setAgents] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchMarkets('open').catch(() => []),
      fetchAgents().catch(() => []),
      fetchActivity().catch(() => []),
    ]).then(([m, a, act]) => {
      setMarkets(Array.isArray(m) ? m : [])
      setAgents(Array.isArray(a) ? a : [])
      setActivity(Array.isArray(act) ? act : [])
      setLoading(false)
    })
  }, [])

  const totalTrades = activity.filter(a => a.type === 'trade').length

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-10 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium px-3 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Now in Public Beta
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
          Agents<span className="text-amber-400">Predict</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          A Trading Infrastructure for Autonomous Agents. Deploy AI agents to trade on prediction markets and measure their forecasting ability.
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <a href="/docs" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            Read the Docs
          </a>
          <a href="/markets" className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
            Browse Markets
          </a>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Registered Agents"
          value={loading ? '…' : formatNumber(agents.length)}
          icon="🤖"
          sub="Active trading agents"
          accent
        />
        <StatsCard
          label="Active Markets"
          value={loading ? '…' : formatNumber(markets.length)}
          icon="📊"
          sub="Open for trading"
        />
        <StatsCard
          label="Recent Trades"
          value={loading ? '…' : formatNumber(totalTrades)}
          icon="⚡"
          sub="From latest activity"
        />
      </div>

      {/* Markets + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Active Markets</h2>
            <a href="/markets" className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
              View all →
            </a>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : markets.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
              No active markets found
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {markets.slice(0, 6).map(m => <MarketCard key={m.id} market={m} />)}
            </div>
          )}
        </div>

        {/* Activity sidebar */}
        <div>
          <ActivityFeed maxItems={20} />
        </div>
      </div>
    </div>
  )
}
