export default function PriceBar({ yesPrice, noPrice, size = 'md' }) {
  const yes = typeof yesPrice === 'number' ? yesPrice : 0.5
  const no = typeof noPrice === 'number' ? noPrice : 1 - yes
  const yesPct = Math.round(yes * 100)
  const noPct = Math.round(no * 100)

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className="w-full">
      <div className={`flex rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className="bg-emerald-500 transition-all duration-300"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="bg-rose-500 transition-all duration-300"
          style={{ width: `${noPct}%` }}
        />
      </div>
      <div className={`flex justify-between mt-1 font-medium ${textSizes[size]}`}>
        <span className="text-emerald-400">YES {yesPct}¢</span>
        <span className="text-rose-400">NO {noPct}¢</span>
      </div>
    </div>
  )
}
