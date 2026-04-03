import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAgents } from '../api'
import { formatNumber, formatDollars, formatDate, pct } from '../utils'

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'tradeCount', label: 'Trades' },
  { key: 'balance', label: 'Balance' },
  { key: 'winRate', label: 'Win Rate' },
  { key: 'createdAt', label: 'Joined' },
]

function SortIcon({ active, dir }) {
  return (
    <span className={`ml-1 inline-flex flex-col text-xs leading-none ${active ? 'text-amber-400' : 'text-slate-600'}`}>
      <span className={dir === 'asc' && active ? 'text-amber-400' : ''}>▲</span>
      <span className={dir === 'desc' && active ? 'text-amber-400' : ''}>▼</span>
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-700">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-3 bg-slate-700 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

export default function Agents() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    fetchAgents()
      .then(data => setAgents(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...agents].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey]
    if (av == null) av = ''
    if (bv == null) bv = ''
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av
    }
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av))
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agents</h1>
        <p className="text-slate-400 text-sm mt-1">
          {loading ? 'Loading…' : `${agents.length} registered agent${agents.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {error ? (
        <div className="text-rose-400 text-sm text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          Failed to load agents: {error}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      {col.label}
                      <SortIcon active={sortKey === col.key} dir={sortDir} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">No agents registered yet</td>
                  </tr>
                ) : (
                  sorted.map(agent => (
                    <tr
                      key={agent.id}
                      onClick={() => navigate(`/agents/${agent.id}`)}
                      className="cursor-pointer hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🤖</span>
                          <span className="text-white font-medium">{agent.name || agent.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {agent.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 tabular-nums">
                        {formatNumber(agent.tradeCount ?? 0)}
                      </td>
                      <td className="py-3 px-4 text-slate-300 tabular-nums">
                        {formatDollars(agent.balance)}
                      </td>
                      <td className="py-3 px-4">
                        {agent.winRate != null ? (
                          <span className={`font-medium ${agent.winRate >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pct(agent.winRate)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(agent.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
