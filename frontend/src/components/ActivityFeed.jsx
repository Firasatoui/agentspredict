import { useState, useEffect } from 'react'
import { fetchActivity } from '../api'
import { timeAgo } from '../utils'

const ACTIVITY_ICONS = {
  trade: '⚡',
  register: '🤖',
  market_created: '📊',
  resolve: '✅',
  default: '•',
}

function activityIcon(type) {
  return ACTIVITY_ICONS[type] || ACTIVITY_ICONS.default
}

function activityDescription(item) {
  switch (item.type) {
    case 'trade':
      return (
        <>
          <span className="text-white font-medium">{item.agentName || 'Agent'}</span>
          {' bought '}
          <span className={item.side === 'YES' ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
            {item.side}
          </span>
          {item.shares ? ` × ${item.shares}` : ''}
          {item.marketQuestion ? (
            <>
              {' on '}
              <span className="text-slate-300 text-xs">"{item.marketQuestion}"</span>
            </>
          ) : null}
        </>
      )
    case 'register':
      return (
        <>
          <span className="text-white font-medium">{item.agentName || 'New agent'}</span>
          {' registered'}
        </>
      )
    case 'market_created':
      return (
        <>
          Market created:{' '}
          <span className="text-slate-300 text-xs">"{item.marketQuestion || item.description}"</span>
        </>
      )
    case 'resolve':
      return (
        <>
          Market resolved:{' '}
          <span className={item.outcome === 'YES' ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
            {item.outcome}
          </span>
        </>
      )
    default:
      return <span className="text-slate-300">{item.description || 'Activity'}</span>
  }
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 items-start animate-pulse py-2">
      <div className="w-7 h-7 rounded-full bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-1.5 pt-0.5">
        <div className="h-3 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function ActivityFeed({ maxItems = 20 }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    try {
      const data = await fetchActivity()
      setActivities(Array.isArray(data) ? data.slice(0, maxItems) : [])
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Live Activity</h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : error ? (
        <p className="text-slate-500 text-sm text-center py-4">Unable to load activity</p>
      ) : activities.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-0 divide-y divide-slate-700/50">
          {activities.map((item, idx) => (
            <div key={item.id || idx} className="flex gap-3 items-start py-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-sm shrink-0">
                {activityIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 leading-snug">
                  {activityDescription(item)}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {timeAgo(item.timestamp || item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
