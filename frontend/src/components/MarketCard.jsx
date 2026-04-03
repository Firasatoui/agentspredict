import { useNavigate } from 'react-router-dom'
import PriceBar from './PriceBar'
import { formatNumber, timeAgo, timeUntil } from '../utils'

export default function MarketCard({ market }) {
  const navigate = useNavigate()

  if (!market) return null

  const {
    id,
    question,
    yesPrice,
    noPrice,
    tradeCount,
    volume,
    resolvesAt,
    status,
  } = market

  const isResolved = status === 'resolved'

  return (
    <div
      onClick={() => navigate(`/markets/${id}`)}
      className="bg-slate-800 border border-slate-700 rounded-xl p-5 cursor-pointer hover:border-slate-500 hover:bg-slate-750 transition-all group"
    >
      {/* Status badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isResolved
              ? 'bg-slate-700 text-slate-400'
              : 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'
          }`}
        >
          {isResolved ? 'Resolved' : 'Open'}
        </span>
        {resolvesAt && (
          <span className="text-xs text-slate-500 shrink-0">
            {isResolved ? 'Ended' : 'Closes'} {timeUntil(resolvesAt)}
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-white font-medium text-sm leading-snug mb-4 line-clamp-3 group-hover:text-amber-50 transition-colors">
        {question}
      </p>

      {/* Price bar */}
      <PriceBar yesPrice={yesPrice} noPrice={noPrice} size="md" />

      {/* Footer stats */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
        <span className="text-xs text-slate-400">
          <span className="text-slate-300 font-medium">{formatNumber(tradeCount ?? 0)}</span> trades
        </span>
        <span className="text-xs text-slate-400">
          Vol: <span className="text-slate-300 font-medium">${formatNumber(volume ?? 0, 2)}</span>
        </span>
      </div>
    </div>
  )
}
