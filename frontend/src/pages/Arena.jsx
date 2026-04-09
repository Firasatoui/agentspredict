import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchAgents, fetchRecentTrades, fetchActivity, runAgentLoop } from '../api'
import { formatNumber, formatDollars, timeAgo } from '../utils'

function ShimmerRow() {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="shimmer w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-3 w-1/2 rounded" />
      </div>
    </div>
  )
}

export default function Arena() {
  const [trades, setTrades] = useState(null)
  const [agents, setAgents] = useState(null)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState(null)
  const [error, setError] = useState(null)

  const loadData = useCallback(() => {
    Promise.allSettled([
      fetchRecentTrades(),
      fetchAgents(),
      fetchActivity(),
    ]).then(([t, a, act]) => {
      if (t.status === 'fulfilled') setTrades(t.value)
      if (a.status === 'fulfilled') setAgents(a.value)
      if (act.status === 'fulfilled') setActivity(act.value)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  async function handleRun() {
    setRunning(true)
    setRunResult(null)
    setError(null)
    try {
      const result = await runAgentLoop()
      setRunResult(result)
      loadData()
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  const totalTrades = agents?.reduce((s, a) => s + (a.trade_count || a.tradeCount || 0), 0) ?? 0
  const totalVolume = trades?.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0) ?? 0
  const agentCount = agents?.length ?? 0

  // Combine trades and activity for feed
  const feedItems = trades ?? activity ?? []

  return (
    <div className="animate-fadeInUp">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              ⚡ <span className="gradient-text">Live Arena</span>
            </h1>
            <p className="text-slate-400">Real-time agent trading activity. Auto-refreshes every 5 seconds.</p>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="btn-solid px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {running ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Running...
              </>
            ) : (
              <>🚀 Run Agent Loop</>
            )}
          </button>
        </div>

        {/* Run result */}
        {runResult && (
          <div className="glass rounded-xl p-4 mb-4 animate-fadeIn" style={{ border: '1px solid rgba(74,222,128,0.3)' }}>
            <p className="text-green-400 text-sm font-medium">✅ Agent loop completed successfully</p>
            {runResult.summary && <p className="text-slate-400 text-xs mt-1">{runResult.summary}</p>}
            {runResult.tradesExecuted != null && <p className="text-slate-400 text-xs mt-1">{runResult.tradesExecuted ?? runResult.trades_executed} trades executed this round</p>}
          </div>
        )}
        {error && (
          <div className="glass rounded-xl p-4 mb-4 animate-fadeIn" style={{ border: '1px solid rgba(248,113,113,0.3)' }}>
            <p className="text-red-400 text-sm font-medium">❌ {error}</p>
          </div>
        )}

        {/* Live stats bar */}
        <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-6" style={{
          border: '1px solid rgba(34,211,238,0.12)',
        }}>
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{formatNumber(agentCount)}</span>
            <span className="text-xs text-slate-500">agents</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{formatNumber(totalTrades)}</span>
            <span className="text-xs text-slate-500">total trades</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: '#4ade80' }}>{formatDollars(totalVolume)}</span>
            <span className="text-xs text-slate-500">recent volume</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-lg font-bold text-white">Trade Feed</h2>
              <span className="text-xs text-slate-500 tabular-nums">{feedItems.length} trades</span>
            </div>

            {loading ? (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {[...Array(8)].map((_, i) => <ShimmerRow key={i} />)}
              </div>
            ) : feedItems.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-500">No trades yet. Click "Run Agent Loop" to start!</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {feedItems.map((trade, i) => {
                  const agentName = trade.agent_name || trade.agentName || 'Agent'
                  const question = trade.market_question || trade.marketQuestion || trade.question || trade.description || ''
                  const side = trade.side || (trade.outcome === 'YES' ? 'YES' : trade.outcome === 'NO' ? 'NO' : null)
                  const amount = parseFloat(trade.amount) || 0
                  const shares = parseFloat(trade.shares_received || trade.sharesReceived) || 0
                  const priceImpact = parseFloat(trade.price_impact || trade.priceImpact) || 0
                  const createdAt = trade.created_at || trade.createdAt || trade.timestamp

                  return (
                    <div key={trade.id || i} className="px-5 py-4 tr-hover transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{
                          background: 'rgba(34,211,238,0.1)',
                          border: '1px solid rgba(34,211,238,0.2)',
                        }}>
                          🤖
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{agentName}</span>
                            {side && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                side === 'YES'
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`} style={{
                                background: side === 'YES' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                                border: `1px solid ${side === 'YES' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                              }}>
                                {side}
                              </span>
                            )}
                            <span className="text-xs text-slate-600 ml-auto flex-shrink-0">{timeAgo(createdAt)}</span>
                          </div>
                          {question && (
                            <p className="text-xs text-slate-400 truncate mb-1.5">{question}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {amount > 0 && <span>💰 {formatDollars(amount)}</span>}
                            {shares > 0 && <span>📦 {shares.toFixed(2)} shares</span>}
                            {priceImpact !== 0 && (
                              <span style={{ color: priceImpact > 0 ? '#4ade80' : '#f87171' }}>
                                Impact: {priceImpact > 0 ? '+' : ''}{(priceImpact * 100).toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Agent quick stats */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-lg font-bold text-white">Agent Stats</h2>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => <ShimmerRow key={i} />)}
              </div>
            ) : !agents?.length ? (
              <div className="p-8 text-center">
                <p className="text-slate-500 text-sm">No agents yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {agents.map((agent) => {
                  const balance = parseFloat(agent.balance) || 0
                  const tradeCount = agent.trade_count ?? agent.tradeCount ?? 0
                  const pnl = balance - 1000
                  const name = agent.name || `Agent ${agent.id}`

                  return (
                    <Link
                      key={agent.id}
                      to={`/agents/${agent.id}`}
                      className="block px-5 py-3.5 tr-hover transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{
                          background: pnl >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                          border: `1px solid ${pnl >= 0 ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                        }}>
                          🤖
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{formatDollars(balance)}</span>
                            <span>·</span>
                            <span>{formatNumber(tradeCount)} trades</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pnl >= 0 ? '+' : ''}{formatDollars(pnl)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className={`text-xs ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {pnl >= 0 ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
