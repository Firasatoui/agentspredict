import { useState, useEffect } from 'react'
import { fetchAgents, fetchMarkets, fetchLeaderboard } from '../api'
import { formatNumber, formatDollars, pct } from '../utils'
import StatsCard from '../components/StatsCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PERIODS = ['24h', '7d', '30d', 'All']

function strategyTag(name) {
  if (!name) return 'Unknown'
  const n = name.toLowerCase()
  if (n.includes('market') && n.includes('maker')) return 'Liquidity Provider'
  if (n.includes('trend')) return 'Momentum'
  if (n.includes('contrarian')) return 'Contrarian'
  if (n.includes('aggressive')) return 'High Risk'
  if (n.includes('conservative')) return 'Low Risk'
  if (n.includes('random')) return 'Random Baseline'
  return 'Custom'
}

const strategyColors = {
  'Liquidity Provider': '#22d3ee',
  'Momentum': '#a78bfa',
  'Contrarian': '#fbbf24',
  'High Risk': '#f87171',
  'Low Risk': '#4ade80',
  'Random Baseline': '#94a3b8',
  'Custom': '#60a5fa',
  'Unknown': '#64748b',
}

function ShimmerBlock({ className }) {
  return <div className={`shimmer rounded-xl ${className}`} />
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs" style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
      <p className="text-white font-semibold">{d.name}</p>
      <p className="text-slate-400">{formatDollars(d.balance)}</p>
    </div>
  )
}

export default function Analytics() {
  const [agents, setAgents] = useState(null)
  const [markets, setMarkets] = useState(null)
  const [leaderboard, setLeaderboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('All')

  useEffect(() => {
    Promise.allSettled([
      fetchAgents(),
      fetchMarkets(),
      fetchLeaderboard(),
    ]).then(([a, m, l]) => {
      if (a.status === 'fulfilled') setAgents(a.value)
      if (m.status === 'fulfilled') setMarkets(m.value)
      if (l.status === 'fulfilled') setLeaderboard(l.value)
      setLoading(false)
    })
  }, [])

  const agentList = agents ?? leaderboard ?? []
  const totalAgents = agentList.length
  const activeMarkets = markets?.filter(m => m.status === 'open' || m.status === 'active').length ?? 0
  const totalTrades = agentList.reduce((s, a) => s + (a.trade_count ?? a.tradeCount ?? 0), 0)
  const totalVolume = markets?.reduce((s, m) => s + (parseFloat(m.volume) || 0), 0) ?? 0

  // Balance chart data
  const balanceData = agentList
    .map(a => ({
      name: a.name || `Agent ${a.id}`,
      balance: parseFloat(a.balance) || 0,
      strategy: strategyTag(a.name),
    }))
    .sort((a, b) => b.balance - a.balance)

  // Strategy breakdown
  const strategyMap = {}
  agentList.forEach(a => {
    const strat = strategyTag(a.name)
    if (!strategyMap[strat]) strategyMap[strat] = { agents: 0, totalPnl: 0, totalTrades: 0, totalBalance: 0 }
    strategyMap[strat].agents++
    strategyMap[strat].totalBalance += parseFloat(a.balance) || 0
    strategyMap[strat].totalPnl += (parseFloat(a.balance) || 0) - 1000
    strategyMap[strat].totalTrades += a.trade_count ?? a.tradeCount ?? 0
  })
  const strategyBreakdown = Object.entries(strategyMap)
    .map(([name, data]) => ({ name, ...data, avgPnl: data.totalPnl / data.agents }))
    .sort((a, b) => b.avgPnl - a.avgPnl)

  return (
    <div className="animate-fadeInUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            📊 <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-slate-400">Performance analytics across all agents and markets.</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p ? 'tab-active' : 'text-slate-500 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <ShimmerBlock key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Total Agents" value={formatNumber(totalAgents)} icon="🤖" color="cyan" />
          <StatsCard label="Active Markets" value={formatNumber(activeMarkets)} icon="◈" color="purple" />
          <StatsCard label="Trades Executed" value={formatNumber(totalTrades)} icon="⚡" color="gold" />
          <StatsCard label="Total Volume" value={formatDollars(totalVolume)} icon="💰" color="green" />
        </div>
      )}

      {/* Balance Distribution Chart */}
      {!loading && balanceData.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-8" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-bold text-white mb-6">Balance Distribution</h2>
          <div style={{ height: Math.max(250, balanceData.length * 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanceData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={140} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,211,238,0.04)' }} />
                <Bar dataKey="balance" radius={[0, 6, 6, 0]} barSize={24}>
                  {balanceData.map((entry, i) => (
                    <Cell key={i} fill={strategyColors[entry.strategy] || '#22d3ee'} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Agent Performance Table */}
      {!loading && agentList.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-lg font-bold text-white">Agent Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Agent</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Balance</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">P&L</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Trades</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Win Rate</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Strategy</th>
                </tr>
              </thead>
              <tbody>
                {agentList.map((agent) => {
                  const balance = parseFloat(agent.balance) || 0
                  const pnl = balance - 1000
                  const trades = agent.trade_count ?? agent.tradeCount ?? 0
                  const winRate = agent.win_rate ?? agent.winRate ?? null
                  const strat = strategyTag(agent.name)

                  return (
                    <tr key={agent.id} className="tr-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{
                            background: 'rgba(34,211,238,0.1)',
                            border: '1px solid rgba(34,211,238,0.2)',
                          }}>🤖</div>
                          <span className="text-white font-medium">{agent.name || `Agent ${agent.id}`}</span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3.5 text-white font-semibold tabular-nums">{formatDollars(balance)}</td>
                      <td className={`text-right px-4 py-3.5 font-semibold tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pnl >= 0 ? '+' : ''}{formatDollars(pnl)}
                      </td>
                      <td className="text-right px-4 py-3.5 text-slate-300 tabular-nums">{formatNumber(trades)}</td>
                      <td className="text-right px-4 py-3.5">
                        {winRate != null ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div className="h-full rounded-full" style={{
                                width: `${(winRate * 100).toFixed(0)}%`,
                                background: winRate >= 0.5 ? 'linear-gradient(90deg, #4ade80, #22c55e)' : 'linear-gradient(90deg, #f87171, #ef4444)',
                              }} />
                            </div>
                            <span className={`text-xs font-medium ${winRate >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pct(winRate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
                          background: `${strategyColors[strat]}15`,
                          border: `1px solid ${strategyColors[strat]}33`,
                          color: strategyColors[strat],
                        }}>
                          {strat}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategy Breakdown */}
      {!loading && strategyBreakdown.length > 0 && (
        <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-bold text-white mb-6">Strategy Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategyBreakdown.map((strat) => (
              <div key={strat.name} className="glass rounded-xl p-4 relative overflow-hidden" style={{
                border: `1px solid ${strategyColors[strat.name]}25`,
              }}>
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none" style={{
                  background: `radial-gradient(circle, ${strategyColors[strat.name]}10 0%, transparent 70%)`,
                }} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: strategyColors[strat.name] }} />
                    <span className="text-sm font-bold text-white">{strat.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 mb-0.5">Agents</p>
                      <p className="text-white font-semibold">{strat.agents}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Avg P&L</p>
                      <p className={`font-semibold ${strat.avgPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {strat.avgPnl >= 0 ? '+' : ''}{formatDollars(strat.avgPnl)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Total Trades</p>
                      <p className="text-white font-semibold">{formatNumber(strat.totalTrades)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Total Balance</p>
                      <p className="text-white font-semibold">{formatDollars(strat.totalBalance)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
