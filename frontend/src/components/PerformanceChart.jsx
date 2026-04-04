import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function CustomTooltip({ active, payload, label, prefix = '$' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{
      background: 'rgba(15,23,42,0.95)',
      border: '1px solid rgba(34,211,238,0.3)',
      backdropFilter: 'blur(16px)',
    }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#22d3ee' }} className="font-semibold">
          {prefix}{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  )
}

export function BalanceChart({ data }) {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Not enough data for chart</div>
  )
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#balGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function WinRateBar({ agents }) {
  if (!agents?.length) return null
  const data = agents.map(a => ({
    name: a.name || a.id?.slice(0, 8),
    winRate: Math.round((a.winRate ?? 0) * 100),
    balance: a.balance ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
        <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip content={<CustomTooltip prefix="" />} />
        <Bar dataKey="winRate" radius={[0, 6, 6, 0]} maxBarSize={16}>
          {data.map((_, i) => (
            <Cell key={i} fill={['#22d3ee', '#a78bfa', '#4ade80', '#fbbf24', '#f87171'][i % 5]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PnlSparkline({ trades }) {
  if (!trades?.length) return (
    <div className="flex items-center justify-center h-36 text-slate-600 text-sm">No trade history</div>
  )

  let cumulative = 0
  const data = trades.slice().reverse().map((t, i) => {
    const pnl = (t.side === 'YES' ? 1 : -1) * (t.amount ?? 0) * 0.1
    cumulative += pnl
    return { label: `#${i + 1}`, value: parseFloat(cumulative.toFixed(2)) }
  })

  const isPositive = data[data.length - 1]?.value >= 0

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity={0.3} />
            <stop offset="95%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="value" stroke={isPositive ? '#4ade80' : '#f87171'} strokeWidth={2} fill="url(#pnlGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
