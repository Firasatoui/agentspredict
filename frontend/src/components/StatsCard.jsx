export default function StatsCard({ label, value, icon, sub, accent }) {
  return (
    <div className={`bg-slate-800 rounded-xl p-5 border ${accent ? 'border-amber-500/30' : 'border-slate-700'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value ?? '—'}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={`text-2xl p-2 rounded-lg ${accent ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
