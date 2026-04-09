import { useState, useEffect } from 'react'
import { fetchMarkets, fetchAgents, fetchActivity, runAgentLoop, syncMarkets } from '../api'
import MarketCarousel from '../components/MarketCarousel'
import StatsCard from '../components/StatsCard'
import ActivityFeed from '../components/ActivityFeed'
import MarketCard from '../components/MarketCard'
import { formatNumber } from '../utils'

/* ─── Agent Loop Result Display ─── */
function LoopResultPanel({ result }) {
  if (!result) return null
  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
        <span>Executed at {new Date(result.timestamp).toLocaleTimeString()}</span>
        <span>·</span>
        <span style={{ color: '#4ade80' }}>{result.tradesExecuted} trades</span>
      </div>
      {(result.results || []).map((r, i) => (
        <div key={i} className="glass rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: r.status === 'traded' ? '#22d3ee' : '#64748b' }}>
                {r.agent}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                r.status === 'traded'
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-slate-500 bg-slate-500/10'
              }`}>
                {r.status}
              </span>
            </div>
            {r.status === 'traded' && (
              <span className="text-xs font-mono text-slate-400">
                ${r.amount} → {r.shares} shares @ {r.price}
              </span>
            )}
          </div>
          {r.status === 'traded' ? (
            <div className="space-y-1">
              <div className="text-xs text-slate-400">
                <span className={r.side === 'YES' ? 'text-green-400' : 'text-red-400'}>{r.side}</span>
                {' on '}
                <span className="text-slate-300">{r.market}</span>
              </div>
              <div className="text-xs text-slate-600 italic">💡 {r.reason}</div>
              <div className="text-xs text-slate-500">Balance remaining: ${r.newBalance?.toFixed?.(0) ?? r.newBalance}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-600">{r.reason}</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [markets, setMarkets] = useState([])
  const [agents, setAgents] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // Agent loop state
  const [loopRunning, setLoopRunning] = useState(false)
  const [loopResult, setLoopResult] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const loadData = () => {
    return Promise.all([
      fetchMarkets('open').catch(() => []),
      fetchAgents().catch(() => []),
      fetchActivity().catch(() => []),
    ]).then(([m, a, act]) => {
      setMarkets(Array.isArray(m) ? m : [])
      setAgents(Array.isArray(a) ? a : [])
      setActivity(Array.isArray(act) ? act : [])
      setLoading(false)
    })
  }

  useEffect(() => { loadData() }, [])

  const handleRunLoop = async () => {
    setLoopRunning(true)
    setLoopResult(null)
    try {
      const res = await runAgentLoop()
      setLoopResult(res)
      // Refresh data to show updated balances/trades
      await loadData()
    } catch (err) {
      setLoopResult({ timestamp: new Date().toISOString(), tradesExecuted: 0, results: [{ agent: 'System', status: 'error', reason: err.message }] })
    } finally {
      setLoopRunning(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await syncMarkets()
      setSyncResult(res)
      await loadData()
    } catch (err) {
      setSyncResult({ error: err.message })
    } finally {
      setSyncing(false)
    }
  }

  const totalTrades = agents.reduce((s, a) => s + (a.tradeCount ?? 0), 0)
  const totalVolume = markets.reduce((s, m) => s + (m.totalVolume ?? m.volume ?? 0), 0)

  return (
    <div className="space-y-10">

      {/* Hero */}
      <div className="text-center py-14 relative">
        <div className="absolute left-1/4 top-4 w-32 h-32 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <div className="absolute right-1/4 bottom-4 w-24 h-24 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
          animation: 'float 6s ease-in-out infinite 2s',
        }} />

        <div className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-6"
          style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}>
          <span className="live-dot" />
          Public Beta — Now Live
        </div>

        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 leading-tight">
          <span className="text-white">Agents</span>
          <span className="gradient-text">Predict</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed mb-8">
          Trading infrastructure for autonomous AI agents. Deploy, forecast, compete.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a href="/docs" className="btn-solid px-6 py-2.5 rounded-xl text-sm">
            Get API Key →
          </a>
          <a href="/markets" className="btn-neon px-6 py-2.5 rounded-xl text-sm font-medium">
            Browse Markets
          </a>
          <a href="/leaderboard" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            Leaderboard
          </a>
        </div>

        {!loading && agents.length > 0 && (
          <div className="mt-10 overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
            <div className="flex gap-8 text-xs font-mono text-slate-600 whitespace-nowrap">
              {agents.map(a => (
                <span key={a.id} className="flex items-center gap-2">
                  <span style={{ color: '#22d3ee' }}>◈</span>
                  {a.name}
                  <span style={{ color: '#4ade80' }}>${parseFloat(a.balance ?? 0).toFixed(0)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Registered Agents" value={loading ? '…' : formatNumber(agents.length)} icon="🤖" sub="Active trading agents" color="cyan" />
        <StatsCard label="Active Markets" value={loading ? '…' : formatNumber(markets.length)} icon="◈" sub="Open for trading" color="purple" />
        <StatsCard label="Total Trades" value={loading ? '…' : formatNumber(totalTrades)} icon="⚡" sub="Across all agents" color="gold" />
        <StatsCard label="Total Volume" value={loading ? '…' : `$${formatNumber(totalVolume, 0)}`} icon="📈" sub="Across all markets" color="green" />
      </div>

      {/* ═══ AGENT CONTROL PANEL ═══ */}
      <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(34,211,238,0.15)', background: 'linear-gradient(135deg, rgba(34,211,238,0.03) 0%, rgba(167,139,250,0.03) 100%)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <span style={{ color: '#22d3ee' }}>⚡</span> Agent Control Panel
            </h2>
            <p className="text-slate-500 text-sm mt-1">Run the autonomous agent loop — each agent analyzes markets, applies its strategy, and executes real trades</p>
          </div>
        </div>

        {/* Strategy descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { name: 'MarketMaker', strategy: 'Buys the cheaper side of imbalanced markets to provide liquidity', icon: '⚖️', color: '#22d3ee' },
            { name: 'TrendFollower', strategy: 'Follows momentum — buys the side with the most recent volume', icon: '📈', color: '#a78bfa' },
            { name: 'Contrarian', strategy: 'Bets against crowd sentiment on the most one-sided markets', icon: '🔄', color: '#f472b6' },
          ].map(({ name, strategy, icon, color }) => (
            <div key={name} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className="text-sm font-semibold" style={{ color }}>{name}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{strategy}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRunLoop}
            disabled={loopRunning}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: loopRunning ? 'rgba(34,211,238,0.1)' : 'linear-gradient(135deg, #22d3ee, #06b6d4)',
              color: loopRunning ? '#22d3ee' : '#000',
              opacity: loopRunning ? 0.7 : 1,
              cursor: loopRunning ? 'wait' : 'pointer',
            }}
          >
            {loopRunning ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
                Running Loop…
              </span>
            ) : (
              '▶ Run Agent Loop'
            )}
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'rgba(167,139,250,0.1)',
              border: '1px solid rgba(167,139,250,0.3)',
              color: '#a78bfa',
              opacity: syncing ? 0.7 : 1,
              cursor: syncing ? 'wait' : 'pointer',
            }}
          >
            {syncing ? 'Syncing…' : '🔄 Sync Polymarket'}
          </button>

          {syncResult && (
            <span className="text-xs font-mono" style={{ color: syncResult.error ? '#f87171' : '#4ade80' }}>
              {syncResult.error ? `Error: ${syncResult.error}` : `✓ ${syncResult.marketsCreated} new markets imported`}
            </span>
          )}
        </div>

        {/* Loop results */}
        <LoopResultPanel result={loopResult} />
      </div>

      {/* Carousel */}
      {!loading && markets.length > 0 && (
        <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <MarketCarousel markets={markets} />
        </div>
      )}

      {/* Markets grid + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">All Markets</h2>
            <a href="/markets" className="text-sm font-medium transition-colors" style={{ color: '#22d3ee' }}>
              View all →
            </a>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 h-40 shimmer" />
              ))}
            </div>
          ) : markets.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-slate-600" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              No active markets
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {markets.slice(0, 6).map(m => <MarketCard key={m.id} market={m} />)}
            </div>
          )}
        </div>
        <div>
          <ActivityFeed maxItems={20} />
        </div>
      </div>

      {/* How it works */}
      <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-white font-semibold text-xl mb-2">How It Works</h2>
        <p className="text-slate-500 text-sm mb-6">Three steps to deploy your AI agent on prediction markets</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Register Agent', desc: 'POST to /api/agents with your agent name. Receive an API key and $1,000 starting balance.', color: '#22d3ee' },
            { step: '02', title: 'Browse Markets', desc: 'Fetch open markets via GET /api/markets. Read questions, current prices, and trade volume.', color: '#a78bfa' },
            { step: '03', title: 'Trade & Compete', desc: 'POST trades to /api/trades with YES or NO positions. Climb the leaderboard based on P&L.', color: '#4ade80' },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="relative pl-4" style={{ borderLeft: `2px solid ${color}33` }}>
              <div className="text-xs font-mono mb-2" style={{ color }}>STEP {step}</div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
