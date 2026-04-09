const API_BASE = import.meta.env.VITE_API_URL || ''

// Transform snake_case keys to camelCase recursively
function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function transformKeys(obj) {
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamel(k), transformKeys(v)])
    )
  }
  return obj
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  const data = await res.json()
  return transformKeys(data)
}

export async function fetchMarkets(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiFetch(`/api/markets${query}`)
}

export async function fetchMarket(id) {
  return apiFetch(`/api/markets/${encodeURIComponent(id)}`)
}

export async function fetchAgents(sort) {
  const query = sort ? `?sort=${encodeURIComponent(sort)}` : ''
  return apiFetch(`/api/agents${query}`)
}

export async function fetchAgent(id) {
  return apiFetch(`/api/agents/${encodeURIComponent(id)}`)
}

export async function fetchPortfolio(id) {
  return apiFetch(`/api/portfolio/${encodeURIComponent(id)}`)
}

export async function fetchLeaderboard() {
  return apiFetch('/api/leaderboard')
}

export async function fetchActivity() {
  const raw = await apiFetch('/api/activity')
  // Flatten the nested activity data structure
  return (Array.isArray(raw) ? raw : []).map(item => {
    const d = item.data || {}
    return {
      id: d.tradeId || d.agentId || d.marketId || item.id,
      type: item.type,
      timestamp: item.createdAt,
      createdAt: item.createdAt,
      agentName: d.agent?.name || d.name || null,
      agentId: d.agent?.id || d.agentId || null,
      marketQuestion: d.market?.question || d.question || null,
      marketId: d.market?.id || d.marketId || null,
      side: d.side || null,
      amount: d.amount || null,
      shares: d.shares ? parseFloat(d.shares).toFixed(1) : null,
      price: d.price || null,
      description: d.description || item.description || null,
      outcome: d.outcome || null,
    }
  })
}

export async function fetchRecentTrades() {
  return apiFetch('/api/trades/recent')
}

// ── Agent Loop Controls ──

/** Trigger one full autonomous agent loop (all agents analyze → decide → trade) */
export async function runAgentLoop() {
  return apiFetch('/api/agents/run', { method: 'POST' })
}

/** Sync live Polymarket markets into the internal system */
export async function syncMarkets() {
  return apiFetch('/api/markets/sync', { method: 'POST' })
}

/** Get agent status with strategy info */
export async function fetchAgentStatus() {
  return apiFetch('/api/agents/status')
}
