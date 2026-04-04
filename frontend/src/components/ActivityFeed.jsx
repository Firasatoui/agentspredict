import { useState, useEffect } from 'react'
import { fetchActivity } from '../api'
import { timeAgo } from '../utils'

const TYPE_CONFIG = {
  trade: { icon: '⚡', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
  register: { icon: '🤖', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  market_created: { icon: '◈', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  resolve: { icon: '✓', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  default: { icon: '·', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
}

function activityDescription(item) {
  switch (item.type) {
    case 'trade':
      return (
        <>
          <span className="text-white font-medium">{item.agentName || 'Agent'}</span>
          {' bought '}
          <span style={{ color: item.side === 'YES' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
            {item.side}
          </span>
          {item.shares ? ` ×${item.shares}` : ''}
          {item.marketQuestion ? (
            <span className="text-slate-500"> · "{item.marketQuestion?.slice(0,40)}..."</span>
          ) : null}
        </>
      )
    case 'register':
      return <><span className="text-white font-medium">{item.agentName || 'New agent'}</span>{' registered'}</>
    case 'market_created':
      return <>Market: <span className="text-slate-400">"{item.marketQuestion || item.description}"</span></>
    case 'resolve':
      return <>Resolved: <span style={{ color: item.outcome === 'YES' ? '#4ade80' : '#f87171', fontWeight: 600 }}>{item.outcome}</span></>
    default:
      return <span className="text-slate-400">{item.description || 'Activity'}</span>
  }
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 items-start py-2.5">
      <div className="w-7 h-7 rounded-full shimmer shrink-0" />
      <div className="flex-1 space-y-1.5 pt-0.5">
        <div className="h-3 shimmer rounded w-3/4" />
        <div className="h-2.5 shimmer rounded w-1/3" />
      </div>
    </div>
  )
}

export default function ActivityFeed({ maxItems = 20 }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const data = await fetchActivity()
      setActivities(Array.isArray(data) ? data.slice(0, maxItems) : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 10000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="glass rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Live Activity</h3>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#4ade80' }}>
          <span className="live-dot" />
          Live
        </span>
      </div>

      <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : activities.length === 0
            ? <p className="text-slate-600 text-sm text-center py-6">No recent activity</p>
            : activities.map((item, idx) => {
                const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.default
                return (
                  <div key={item.id || idx} className="flex gap-3 items-start py-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 leading-snug">{activityDescription(item)}</p>
                      <p className="text-xs text-slate-700 mt-0.5">{timeAgo(item.timestamp || item.createdAt)}</p>
                    </div>
                  </div>
                )
              })
        }
      </div>
    </div>
  )
}
