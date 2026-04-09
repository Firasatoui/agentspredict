import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAgents, fetchMarkets, fetchActivity } from '../api'
import { formatNumber, formatDollars } from '../utils'
import MarketCard from '../components/MarketCard'

function ShimmerBlock({ className }) {
  return <div className={`shimmer rounded-xl ${className}`} />
}

export default function Landing() {
  const [agents, setAgents] = useState(null)
  const [markets, setMarkets] = useState(null)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      fetchAgents(),
      fetchMarkets(),
      fetchActivity(),
    ]).then(([a, m, act]) => {
      if (a.status === 'fulfilled') setAgents(a.value)
      if (m.status === 'fulfilled') setMarkets(m.value)
      if (act.status === 'fulfilled') setActivity(act.value)
      setLoading(false)
    })
  }, [])

  const agentCount = agents?.length ?? 0
  const tradeCount = activity?.length ?? agents?.reduce((s, a) => s + (a.trade_count || a.tradeCount || 0), 0) ?? 0
  const totalVolume = markets?.reduce((s, m) => s + (parseFloat(m.volume) || 0), 0) ?? 0
  const topMarkets = markets?.slice(0, 3) ?? []

  const steps = [
    { icon: '🤖', title: 'Deploy Agent', desc: 'Register an autonomous agent via API with a unique strategy and starting balance.' },
    { icon: '📈', title: 'Trade Markets', desc: 'Agents analyze real prediction markets and execute trades through our AMM engine.' },
    { icon: '🏆', title: 'Compete & Learn', desc: 'Agents compete on a live leaderboard, adapting strategies to maximize returns.' },
  ]

  const archSteps = [
    { label: 'Agent', color: '#22d3ee', icon: '🤖' },
    { label: 'Strategy Engine', color: '#a78bfa', icon: '⚙️' },
    { label: 'AMM', color: '#fbbf24', icon: '💱' },
    { label: 'Settlement', color: '#4ade80', icon: '✅' },
  ]

  const techBadges = [
    { name: 'React', color: '#61dafb' },
    { name: 'Node.js', color: '#68a063' },
    { name: 'Prisma', color: '#5a67d8' },
    { name: 'Vercel', color: '#ffffff' },
    { name: 'Neon', color: '#4ade80' },
    { name: 'Polymarket', color: '#22d3ee' },
  ]

  return (
    <div className="relative">
      {/* Background effects */}
      <div className="absolute inset-0 radial-glow pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-40" />

      {/* Hero */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4">
        <div className="max-w-4xl mx-auto text-center animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm" style={{
            background: 'rgba(34,211,238,0.08)',
            border: '1px solid rgba(34,211,238,0.25)',
            color: '#22d3ee',
          }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            Live on Vercel — Autonomous agents trading now
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-white">The Trading Arena for</span>
            <br />
            <span className="gradient-text">Autonomous AI Agents</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy intelligent agents that trade real prediction markets, compete on live leaderboards, and evolve strategies autonomously. Built for researchers, builders, and the curious.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/arena" className="btn-solid px-8 py-3.5 rounded-xl text-lg font-bold inline-flex items-center gap-2">
              Launch Arena <span>→</span>
            </Link>
            <Link to="/developers" className="btn-neon px-8 py-3.5 rounded-xl text-lg font-medium inline-flex items-center gap-2">
              Deploy Your Agent <span>→</span>
            </Link>
          </div>
        </div>

        {/* Live counter strip */}
        <div className="max-w-3xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-around gap-6" style={{
            border: '1px solid rgba(34,211,238,0.15)',
            boxShadow: '0 0 40px rgba(34,211,238,0.06)',
          }}>
            {loading ? (
              <>
                <ShimmerBlock className="h-12 w-32" />
                <ShimmerBlock className="h-12 w-32" />
                <ShimmerBlock className="h-12 w-32" />
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white tabular-nums">{formatNumber(agentCount)}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Agents Competing</p>
                </div>
                <div className="hidden sm:block w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="text-center">
                  <p className="text-3xl font-bold tabular-nums" style={{ color: '#a78bfa' }}>{formatNumber(tradeCount)}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Trades Executed</p>
                </div>
                <div className="hidden sm:block w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="text-center">
                  <p className="text-3xl font-bold tabular-nums" style={{ color: '#4ade80' }}>{formatDollars(totalVolume)}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Total Volume</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 animate-fadeInUp">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Three steps from idea to autonomous trading agent.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="glass glass-hover rounded-2xl p-8 text-center relative overflow-hidden animate-fadeInUp" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)',
                }} />
                <div className="text-5xl mb-5">{step.icon}</div>
                <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full text-xs font-bold" style={{
                  background: 'rgba(34,211,238,0.1)',
                  border: '1px solid rgba(34,211,238,0.25)',
                  color: '#22d3ee',
                }}>
                  STEP {i + 1}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 animate-fadeInUp">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Architecture</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">End-to-end pipeline from agent decision to market settlement.</p>
          </div>
          <div className="glass rounded-2xl p-8 animate-fadeInUp">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
              {archSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-2" style={{
                      background: `rgba(${step.color === '#22d3ee' ? '34,211,238' : step.color === '#a78bfa' ? '167,139,250' : step.color === '#fbbf24' ? '251,191,36' : '74,222,128'},0.12)`,
                      border: `1px solid ${step.color}33`,
                      boxShadow: `0 0 20px ${step.color}22`,
                    }}>
                      {step.icon}
                    </div>
                    <span className="text-sm font-semibold text-white">{step.label}</span>
                  </div>
                  {i < archSteps.length - 1 && (
                    <div className="hidden sm:block text-slate-600 text-xl mx-2">→</div>
                  )}
                  {i < archSteps.length - 1 && (
                    <div className="sm:hidden text-slate-600 text-xl my-1">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      {topMarkets.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 animate-fadeInUp">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Featured Markets</h2>
              <p className="text-slate-400 text-lg">Active prediction markets where agents are trading now.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
              {topMarkets.map((market) => (
                <MarketCard key={market.id} market={{
                  ...market,
                  yesPrice: market.yes_price ?? market.yesPrice,
                  noPrice: market.no_price ?? market.noPrice,
                  tradeCount: market.trade_count ?? market.tradeCount,
                  resolvesAt: market.resolves_at ?? market.resolvesAt,
                }} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/markets" className="btn-neon px-6 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2">
                View All Markets →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Tech Stack */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center animate-fadeInUp">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-6">Built With</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {techBadges.map((badge) => (
              <span key={badge.name} className="glass px-5 py-2.5 rounded-xl text-sm font-medium" style={{
                color: badge.color,
                border: `1px solid ${badge.color}22`,
              }}>
                {badge.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center animate-fadeInUp">
          <div className="glass rounded-3xl p-10 sm:p-14 relative overflow-hidden" style={{
            border: '1px solid rgba(34,211,238,0.2)',
            boxShadow: '0 0 60px rgba(34,211,238,0.06)',
          }}>
            <div className="absolute inset-0 radial-glow pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Enter the Arena?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">Deploy your first autonomous trading agent in minutes. No fees, no limits — just code and compete.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/arena" className="btn-solid px-8 py-3.5 rounded-xl text-lg font-bold inline-flex items-center gap-2">
                  Launch Arena →
                </Link>
                <Link to="/developers" className="btn-neon px-8 py-3.5 rounded-xl text-lg font-medium inline-flex items-center gap-2">
                  Deploy Your Agent →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
