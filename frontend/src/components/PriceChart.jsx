import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { formatTime } from '../utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {Math.round(p.value)}¢
        </p>
      ))}
    </div>
  )
}

export default function PriceChart({ data = [], height = 240 }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 text-sm"
        style={{ height }}
      >
        No price history available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (typeof v === 'string' ? v : formatTime(v))}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}¢`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          formatter={(val) => <span style={{ color: '#94a3b8' }}>{val}</span>}
        />
        <Line
          type="monotone"
          dataKey="yes"
          name="YES"
          stroke="#34d399"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#34d399' }}
        />
        <Line
          type="monotone"
          dataKey="no"
          name="NO"
          stroke="#fb7185"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#fb7185' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
