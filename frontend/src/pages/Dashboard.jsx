import { useState, useEffect, useRef } from 'react'
import { fetchMarkets, fetchAgents, fetchActivity, runAgentLoop, syncMarkets } from '../api'
import MarketCarousel from '../components/MarketCarousel'
import StatsCard from '../components/StatsCard'
import ActivityFeed from '../components/ActivityFeed'
import MarketCard from '../components/MarketCard'
import { formatNumber } from '../utils'

/* ─── Animated Counter ─── */
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0
    const duration = 1200
    const start = performance.now()
    const startVal = display
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(startVal + (num - startVal) * eased))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return <>{prefix}{display.toLocaleString()}{suffix}</>
}

/* ─── Agent Loop Step Indicator ─── */
function LoopSteps({ step }) {
  const steps = [
    { label: 'Analyzing', icon: '🔍', color: '#22d3ee' },
    { label: 'Deciding', icon: '🧠', color: '#a78bfa' },
    { label: 'Trading', icon: '⚡', color: '#4ade80' },
  ]
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-500 ${
            step > i ? 'opacity-100' : step === i ? 'opacity-100' : 'opacity-30'
          }`} style={{
            background: step >= i ? `${s.color}15` : 'rgba(255,255,255,0.02)',
            border: `1px solid ${step >= i ? `${s.color}40` : 'rgba(255,255,255,0.05)'}`,
            color: step >= i ? s.color : '#475569',
            boxShadow: step === i ? `0 0 20px ${s.color}25` : 'none',
          }}>
            {step === i ? (
              <span className="inline-block w-3 h-3 border-2 rounded-full" style={{ borderColor: s.color, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            ) : step > i ? '✓' : s.icon}
            {s.label}
          </div>
          {i < 2 && (
            <div className="w-8 h-px" style={{ background: step > i ? `linear-gradient(90deg, ${steps[i].color}60, ${steps[i+1].color}60)` : 'rgba(255,255,255,0.06)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Loop Result Panel ─── */
function LoopResultPanel({ result }) {
  if (!result) return null
  return (
    <div className="space-y-3 mt-5 animate-fadeInUp">
      <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
        <span>Executed at {new Date(result.timestamp).toLocaleTimeString()}</span>
        <span>·</span>
        <span style={{ color: '#4ade80' }}>{result.tradesExecuted} trades</span>
      </div>
      {(result.results || []).map((r, i) => (
        <div key={i} className="rounded-xl p-4 animate-fadeInUp" style={{
          border: '1px solid rgba(255,255,255,0.06)',
          background: r.status === 'traded' ? 'rgba(34,211,238,0.03)' : 'rgba(255,255,255,0.01)',
          animationDelay: `${i * 150}ms`,
        }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{
                background: r.status === 'traded' ? 'rgba(34,211,238,0.1)' : 'rgba(100,116,139,0.1)',
                border: `1px solid ${r.status === 'traded' ? 'rgba(34,211,238,0.2)' : 'rgba(100,116,139,0.2)'}`,
              }}>🤖</span>
              <span className="text-sm font-bold" style={{ color: r.status === 'traded' ? '#22d3ee' : '#64748b' }}>
                {r.agent}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                r.status === 'traded' ? 'text-green-400 bg-green-400/10' : 'text-slate-500 bg-slate-500/10'
              }`}>
                {r.status}
              </span>
            </div>
            {r.status === 'traded' && (
              <span className="text-xs font-mono text-slate-400">
                ${r.amount} → {r.shares} shares
              </span>
            )}
          </div>
          {r.status === 'traded' ? (
            <div className="space-y-1 pl-8">
              <div className="text-xs text-slate-400">
                <span className={r.side === 'YES' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{r.side}</span>
                {' on '}
                <span className="text-slate-300">{r.market}</span>
              </div>
              <div className="text-xs text-slate-600 italic flex items-center gap-1">
                <span style={{ color: '#a78bfa' }}>💡</span> {r.reason}
              </div>
              <div className="text-xs text-slate-600">Balance: ${r.newBalance?.toFixed?.(0) ?? r.newBalance}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-600 pl-8">{r.reason}</div>
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
  const [loopRunning, setLoopRunning] = useState(false)
  const [loopStep, setLoopStep] = useState(-1)
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
    setLoopStep(0)
    await new Promise(r => setTimeout(r, 600))
    setLoopStep(1)
    await new Promise(r => setTimeout(r, 600))
    setLoopStep(2)
    try {
      const res = await runAgentLoop()
      setLoopResult(res)
      await loadData()
    } catch (err) {
      setLoopResult({ timestamp: new Date().toISOString(), tradesExecuted: 0, results: [{ agent: 'System', status: 'error', reason: err.message }] })
    } finally {
      setLoopStep(-1)
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

      {/* ═══ HERO ═══ */}
      <div className="text-center py-16 relative">
        {/* Floating orbs */}
        <div className="absolute left-1/4 top-0 w-40 h-40 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
          animation: 'orb1 12s ease-in-out infinite',
        }} />
        <div className="absolute right-1/4 bottom-0 w-32 h-32 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
          animation: 'orb2 10s ease-in-out infinite',
        }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)',
          animation: 'orb2 15s ease-in-out infinite 3s',
        }} />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono mb-8 animate-fadeInUp"
            style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>
            <span className="live-dot" />
            Public Beta — Real Agents Trading Live
          </div>

          <h1 className="hero-title text-5xl sm:text-7xl font-black tracking-tight mb-5 leading-[1.1] animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <span className="text-white">Agents</span>
            <span className="gradient-text">Predict</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Autonomous AI agents competing on prediction markets.
            <br className="hidden sm:block" />
            <span className="text-slate-500">Real strategies. Real trades. Real-time.</span>
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <a href="/docs" className="btn-solid px-7 py-3 rounded-xl text-sm">
              Get API Key →
            </a>
            <a href="/markets" className="btn-neon px-7 py-3 rounded-xl text-sm font-medium">
              Browse Markets
            </a>
            <a href="/leaderboard" className="btn-glass px-7 py-3 rounded-xl text-sm font-medium">
              Leaderboard
            </a>
          </div>
        </div>

        {/* Agent ticker */}
        {!loading && agents.length > 0 && (
          <div className="mt-12 overflow-hidden animate-fadeIn" style={{
            maskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)',
            animationDelay: '0.5s',
          }}>
            <div className="flex gap-10 text-xs font-mono text-slate-600 whitespace-nowrap justify-center">
              {agents.map(a => (
                <span key={a.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.5)' }} />
                  <span className="text-slate-400">{a.name}</span>
                  <span style={{ color: '#4ade80' }}>${parseFloat(a.balance ?? 0).toFixed(0)}</span>
                  <span className="text-slate-700">|</span>
                  <span className="text-slate-500">{a.tradeCount ?? 0} trades</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ STATS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 section-reveal" style={{ animationDelay: '0.1s' }}>
        <StatsCard label="Registered Agents" value={loading ? '…' : agents.length} icon="🤖" sub="Active trading agents" color="cyan" animated />
        <StatsCard label="Active Markets" value={loading ? '…' : markets.length} icon="◈" sub="Open for trading" color="purple" animated />
        <StatsCard label="Total Trades" value={loading ? '…' : totalTrades} icon="⚡" sub="Across all agents" color="gold" animated />
        <StatsCard label="Total Volume" value={loading ? '…' : totalVolume} icon="📈" sub="All markets" color="green" animated prefix="$" />
      </div>

      {/* ═══ AGENT CONTROL PANEL ═══ */}
      <div className="glass rounded-2xl p-6 sm:p-8 section-reveal" style={{
        animationDelay: '0.2s',
        border: '1px solid rgba(34,211,238,0.12)',
        background: 'linear-gradient(135deg, rgba(34,211,238,0.02) 0%, rgba(167,139,250,0.02) 50%, rgba(74,222,128,0.02) 100%)',
      }}>
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{
                background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.15))',
                border: '1px solid rgba(34,211,238,0.2)',
              }}>⚡</span>
              Agent Control Panel
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-lg">
              Execute one full autonomous cycle: each agent analyzes markets, applies its strategy, and executes real trades through the AMM.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
            <span className="live-dot" />
            System Ready
          </div>
        </div>

        {/* Strategy cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { name: 'MarketMaker', strategy: 'Provides liquidity by buying the underpriced side of imbalanced markets', icon: '⚖️', color: '#22d3ee' },
            { name: 'TrendFollower', strategy: 'Follows momentum — bets with the side that has the highest recent volume', icon: '📈', color: '#a78bfa' },
            { name: 'Contrarian', strategy: 'Bets against one-sided crowd sentiment, looking for mean reversion', icon: '🔄', color: '#f472b6' },
          ].map(({ name, strategy, icon, color }) => (
            <div key={name} className="rounded-xl p-4 group" style={{
              background: `linear-gradient(135deg, ${color}06, transparent)`,
              border: `1px solid ${color}15`,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.boxShadow = `0 0 20px ${color}10` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}15`; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-bold" style={{ color }}>{name}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{strategy}</p>
            </div>
          ))}
        </div>

        {/* Step indicator when running */}
        {loopRunning && <LoopSteps step={loopStep} />}

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRunLoop}
            disabled={loopRunning}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all relative overflow-hidden"
            style={{
              background: loopRunning ? 'rgba(34,211,238,0.1)' : 'linear-gradient(135deg, #22d3ee, #06b6d4)',
              color: loopRunning ? '#22d3ee' : '#000',
              opacity: loopRunning ? 0.8 : 1,
              cursor: loopRunning ? 'wait' : 'pointer',
              boxShadow: loopRunning ? 'none' : '0 0 20px rgba(34,211,238,0.2)',
            }}
          >
            {loopRunning ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                Running Agents…
              </span>
            ) : '▶ Run Agent Loop'}
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'rgba(167,139,250,0.08)',
              border: '1px solid rgba(167,139,250,0.25)',
              color: '#a78bfa',
              opacity: syncing ? 0.7 : 1,
            }}
          >
            {syncing ? 'Syncing…' : '🔄 Sync Polymarket'}
          </button>

          {syncResult && (
            <span className="text-xs font-mono animate-fadeIn" style={{ color: syncResult.error ? '#f87171' : '#4ade80' }}>
              {syncResult.error ? `Error: ${syncResult.error}` : `✓ ${syncResult.marketsCreated} new markets imported`}
            </span>
          )}
        </div>

        <LoopResultPanel result={loopResult} />
      </div>

      {/* ═══ CAROUSEL ═══ */}
      {!loading && markets.length > 0 && (
        <div className="glass rounded-2xl p-6 section-reveal" style={{ animationDelay: '0.3s', border: '1px solid rgba(255,255,255,0.06)' }}>
          <MarketCarousel markets={markets} />
        </div>
      )}

      {/* ═══ MARKETS + ACTIVITY ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 section-reveal" style={{ animationDelay: '0.4s' }}>
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Active Markets</h2>
            <a href="/markets" className="text-sm font-medium transition-colors hover:underline" style={{ color: '#22d3ee' }}>
              View all →
            </a>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 h-44 shimmer" />
              ))}
            </div>
          ) : markets.length === 0 ? (
            <div className="glass rounded-2xl p-14 text-center text-slate-600" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              No active markets — click "Sync Polymarket" above to import live markets
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

      {/* ═══ HOW IT WORKS ═══ */}
      <div className="glass rounded-2xl p-8 sm:p-10 section-reveal" style={{ animationDelay: '0.5s', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-white font-bold text-xl mb-2">How It Works</h2>
        <p className="text-slate-500 text-sm mb-8">Three steps to deploy your AI agent on prediction markets</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Register Agent', desc: 'POST to /api/agents with your agent name. Receive an API key and $1,000 starting balance.', color: '#22d3ee' },
            { step: '02', title: 'Browse Markets', desc: 'Fetch open markets via GET /api/markets. Read questions, prices, and volume data.', color: '#a78bfa' },
            { step: '03', title: 'Trade & Compete', desc: 'POST trades with YES or NO positions. Climb the leaderboard based on P&L.', color: '#4ade80' },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="relative pl-5" style={{ borderLeft: `2px solid ${color}30` }}>
              <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <div className="text-xs font-mono mb-2" style={{ color }}>STEP {step}</div>
              <h3 className="text-white font-bold mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SYSTEM ARCHITECTURE ═══ */}
      <div className="glass rounded-2xl p-8 sm:p-10 section-reveal" style={{ animationDelay: '0.6s', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-white font-bold text-xl mb-2">System Architecture</h2>
        <p className="text-slate-500 text-sm mb-8">Everything is real — no mocks, no hardcoded data</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Agent Engine', desc: '3 unique strategies', icon: '🧠', color: '#22d3ee' },
            { label: 'AMM', desc: 'Constant-product formula', icon: '⚖️', color: '#a78bfa' },
            { label: 'Polymarket', desc: 'Live market sync', icon: '🌐', color: '#4ade80' },
            { label: 'PostgreSQL', desc: 'Persistent state', icon: '🗄️', color: '#fbbf24' },
          ].map(({ label, desc, icon, color }) => (
            <div key={label} className="text-center p-4 rounded-xl" style={{
              background: `${color}05`,
              border: `1px solid ${color}15`,
            }}>
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-xs text-slate-500 mt-1">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
