import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatNumber } from '../utils'

function CarouselCard({ market }) {
  const navigate = useNavigate()
  const yesPercent = Math.round((market.yesPrice ?? 0.5) * 100)

  return (
    <div
      onClick={() => navigate(`/markets/${market.id}`)}
      className="cursor-pointer rounded-2xl p-5 flex-shrink-0 relative overflow-hidden"
      style={{
        width: 300,
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(34,211,238,0.15)',
        backdropFilter: 'blur(16px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'
        e.currentTarget.style.boxShadow = '0 0 30px rgba(34,211,238,0.12)'
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.15)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)'
      }} />

      <div className="text-xs font-mono mb-3" style={{ color: '#22d3ee' }}>
        ◈ OPEN MARKET
      </div>

      <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-4" style={{ minHeight: 40 }}>
        {market.question}
      </p>

      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-xs font-mono">
          <span style={{ color: '#4ade80' }}>YES {yesPercent}%</span>
          <span style={{ color: '#f87171' }}>NO {100 - yesPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full price-bar-yes transition-all" style={{ width: `${yesPercent}%` }} />
        </div>
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatNumber(market.tradeCount ?? 0)} trades</span>
        {market.volume != null && <span>Vol ${formatNumber(market.volume, 0)}</span>}
      </div>
    </div>
  )
}

export default function MarketCarousel({ markets = [] }) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const trackRef = useRef(null)
  const cardWidth = 316 // 300 + 16 gap

  const total = markets.length
  useEffect(() => {
    if (total <= 3 || isPaused) return
    const iv = setInterval(() => {
      setCurrent(c => (c + 1) % total)
    }, 3500)
    return () => clearInterval(iv)
  }, [total, isPaused])

  if (total === 0) return null

  return (
    <div className="relative">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-lg">Featured Markets</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.3)',
            color: '#22d3ee',
          }}>
            {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrent(c => (c - 1 + total) % total)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>‹</button>
          <button onClick={() => setCurrent(c => (c + 1) % total)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>›</button>
          <button onClick={() => setIsPaused(p => !p)} className="text-xs text-slate-600 hover:text-cyan-400 transition-colors ml-1">
            {isPaused ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="carousel-wrapper" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div
          ref={trackRef}
          className="carousel-track"
          style={{ transform: `translateX(-${current * cardWidth}px)` }}
        >
          {markets.map(m => <CarouselCard key={m.id} market={m} />)}
        </div>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 mt-4 justify-center">
        {markets.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              background: i === current ? '#22d3ee' : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
