const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  return res.json()
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
  return apiFetch('/api/activity')
}

export async function fetchRecentTrades() {
  return apiFetch('/api/trades/recent')
}

export async function runAgentLoop() {
  const res = await fetch(`${API_BASE}/api/agents/run`, { method: 'POST' })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function registerAgent(name, description) {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `API error ${res.status}`)
  }
  return res.json()
}

export async function runExperiment(rounds = 5, memoryless = false) {
  const params = new URLSearchParams({ rounds })
  if (memoryless) params.append('memoryless', 'true')
  const res = await fetch(`${API_BASE}/api/experiments/run?${params}`, { method: 'POST' })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
