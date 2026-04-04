import { useNavigate } from 'react-router-dom'
import { formatNumber, timeUntil } from '../utils'

export default function MarketCard({ market, external, externalUrl, source }) {
  const navigate = useNavigate()

  if (!market) return null
  const question = market.question || ''
  const yesPrice = market.yesPrice ?? market.yes_price ?? 0.5
  const noPrice = market.noPrice ?? market.no_price ?? 0.5
  const tradeCount = market.tradeCount ?? market.trade_count ?? 0
  const volume = market.totalVolume ?? market.total_volume ?? market.volume ?? null
  const resolvesAt = market.resolvesAt ?? market.resolution_date ?? market.resolutionDate ?? null
  const status = (market.status || 'open').toLowerCase()
  const isResolved = status === 'resolved' || status === 'closed'
  const yesPercent = Math.round((typeof yesPrice === 'number' ? yesPrice : 0.5) * 100)
  const noPercent = 100 - yesPercent

  function handleClick() {
    if (external && externalUrl) {
      window.open(externalUrl, '_blank', 'noopener')
    } else {
      navigate(`/markets/${market.id}`)
    }
  }

  return (
    <div
      onClick={handleClick}
      className="glass glass-hover rounded-2xl p-5 cursor-pointer group relative overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: isResolved
          ? 'rgba(255,255,255,0.05)'
          : 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)'
      }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isResolved
              ? 'bg-slate-700/50 text-slate-500'
              : 'text-emerald-400'
          }`} style={!isResolved ? {
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.3)',
          } : {}}>
            {isResolved ? 'Resolved' : 'Open'}
          </span>
          {source && (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{
              background: source === 'polymarket' ? 'rgba(34,211,238,0.1)' : 'rgba(167,139,250,0.1)',
              border: `1px solid ${source === 'polymarket' ? 'rgba(34,211,238,0.3)' : 'rgba(167,139,250,0.3)'}`,
              color: source === 'polymarket' ? '#22d3ee' : '#a78bfa',
            }}>
              {source === 'polymarket' ? 'POLY' : 'KALSHI'}
            </span>
          )}
        </div>
        {resolvesAt && (
          <span className="text-xs text-slate-600 shrink-0">
            {isResolved ? 'Ended' : 'Closes'} {timeUntil(resolvesAt)}
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-white font-medium text-sm leading-snug mb-4 line-clamp-3 group-hover:text-cyan-50 transition-colors">
        {question}
      </p>

      {/* Price bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-emerald-400 font-semibold">YES {yesPercent}¢</span>
          <span className="text-rose-400 font-semibold">NO {noPercent}¢</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-500 price-bar-yes" style={{ width: `${yesPercent}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs text-slate-500">
          <span className="text-slate-400 font-medium">{formatNumber(tradeCount)}</span> trades
        </span>
        {volume != null && (
          <span className="text-xs text-slate-500">
            Vol: <span className="text-slate-400 font-medium">${formatNumber(volume, 0)}</span>
          </span>
        )}
        {external && (
          <span className="text-xs text-cyan-500 flex items-center gap-1">
            View ↗
          </span>
        )}
      </div>
    </div>
  )
}
