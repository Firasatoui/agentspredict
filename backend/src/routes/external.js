import { Router } from 'express';

const router = Router();

// Proxy: Polymarket top markets
router.get('/external/polymarket', async (req, res) => {
  try {
    const url = 'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=12&order=volume&ascending=false';
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(`Polymarket API returned ${r.status}`);
    const data = await r.json();
    res.json(Array.isArray(data) ? data : (data.markets || data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy: Kalshi top markets
router.get('/external/kalshi', async (req, res) => {
  try {
    const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?limit=12&status=open';
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) {
      // Try the main Kalshi API instead
      const r2 = await fetch('https://api.kalshi.com/trade-api/v2/markets?limit=12&status=open', {
        headers: { 'Accept': 'application/json' }
      });
      if (!r2.ok) throw new Error(`Kalshi API returned ${r2.status}`);
      const data2 = await r2.json();
      return res.json(data2.markets || data2);
    }
    const data = await r.json();
    res.json(data.markets || data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
