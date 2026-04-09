import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { executeTrade, yesPrice, noPrice } from '../lib/amm.js';

const router = Router();
const prisma = new PrismaClient();

/* ──────────── Agent Strategies ──────────── */

const strategies = {
  /**
   * MarketMaker: Provides liquidity by buying the cheaper side
   * of the most imbalanced market. Keeps markets efficient.
   */
  MarketMaker(markets, _recentTrades) {
    let bestMarket = null;
    let maxImbalance = 0;

    for (const m of markets) {
      const yp = parseFloat(m.yes_pool);
      const np = parseFloat(m.no_pool);
      const imbalance = Math.abs(yp - np) / (yp + np);
      if (imbalance > maxImbalance) {
        maxImbalance = imbalance;
        bestMarket = m;
      }
    }

    if (!bestMarket || maxImbalance < 0.02) return null;

    const yp = parseFloat(bestMarket.yes_pool);
    const np = parseFloat(bestMarket.no_pool);
    // Buy the cheaper side (higher pool = cheaper price)
    const side = yp > np ? 'YES' : 'NO';
    const amount = Math.min(15 + Math.floor(Math.random() * 20), 35);

    return {
      marketId: bestMarket.id,
      side,
      amount,
      reason: `Providing liquidity on ${side} side (imbalance: ${(maxImbalance * 100).toFixed(1)}%)`,
    };
  },

  /**
   * TrendFollower: Follows market momentum by buying the side
   * with the most recent trading volume.
   */
  TrendFollower(markets, recentTrades) {
    let bestMarket = null;
    let bestScore = -1;
    let bestSide = 'YES';

    for (const m of markets) {
      const marketTrades = recentTrades.filter((t) => t.market_id === m.id);
      if (marketTrades.length === 0) continue;

      const yesVol = marketTrades
        .filter((t) => t.side === 'YES')
        .reduce((s, t) => s + parseFloat(t.amount), 0);
      const noVol = marketTrades
        .filter((t) => t.side === 'NO')
        .reduce((s, t) => s + parseFloat(t.amount), 0);

      const dominant = yesVol >= noVol ? 'YES' : 'NO';
      const score = Math.max(yesVol, noVol);

      if (score > bestScore) {
        bestScore = score;
        bestMarket = m;
        bestSide = dominant;
      }
    }

    if (!bestMarket) {
      // No trend data — follow price signal
      const m = markets[Math.floor(Math.random() * markets.length)];
      const yp = parseFloat(m.yes_pool);
      const np = parseFloat(m.no_pool);
      return {
        marketId: m.id,
        side: yp > np ? 'YES' : 'NO',
        amount: 20,
        reason: 'No trend data — following price signal',
      };
    }

    const amount = Math.min(20 + Math.floor(Math.random() * 25), 45);
    return {
      marketId: bestMarket.id,
      side: bestSide,
      amount,
      reason: `Following ${bestSide} momentum (volume: ${bestScore.toFixed(0)})`,
    };
  },

  /**
   * Contrarian: Bets against crowd sentiment by buying the
   * less popular side of the most one-sided market.
   */
  Contrarian(markets, _recentTrades) {
    let bestMarket = null;
    let bestScore = -1;
    let bestSide = 'YES';

    for (const m of markets) {
      const yp = parseFloat(m.yes_pool);
      const np = parseFloat(m.no_pool);
      const yPx = np / (yp + np);
      const extremity = Math.abs(yPx - 0.5);

      if (extremity > bestScore) {
        bestScore = extremity;
        bestMarket = m;
        // Buy the unpopular side
        bestSide = yPx < 0.5 ? 'YES' : 'NO';
      }
    }

    if (!bestMarket || bestScore < 0.02) return null;

    const amount = Math.min(15 + Math.floor(Math.random() * 20), 35);
    return {
      marketId: bestMarket.id,
      side: bestSide,
      amount,
      reason: `Contrarian bet on ${bestSide} (market is ${(bestScore * 200).toFixed(0)}% one-sided)`,
    };
  },
};

/* ──────────── POST /api/agents/run ──────────── */

/**
 * Execute one full autonomous agent loop.
 * Each agent: analyzes all open markets → applies its strategy → executes a trade.
 * This is the REAL agent loop — not a mock.
 */
router.post('/agents/run', async (req, res) => {
  try {
    const [agents, markets, recentTrades] = await Promise.all([
      prisma.agent.findMany(),
      prisma.market.findMany({ where: { status: 'OPEN' } }),
      prisma.trade.findMany({ orderBy: { created_at: 'desc' }, take: 100 }),
    ]);

    if (markets.length === 0) {
      return res.json({ timestamp: new Date().toISOString(), message: 'No open markets to trade', tradesExecuted: 0, results: [] });
    }

    const results = [];

    for (const agent of agents) {
      const strategyFn = strategies[agent.name];
      if (!strategyFn) {
        results.push({ agent: agent.name, status: 'skipped', reason: 'No strategy defined' });
        continue;
      }

      const balance = parseFloat(agent.balance);
      if (balance < 15) {
        results.push({ agent: agent.name, status: 'skipped', reason: `Insufficient balance ($${balance.toFixed(0)})` });
        continue;
      }

      const decision = strategyFn(markets, recentTrades);
      if (!decision) {
        results.push({ agent: agent.name, status: 'skipped', reason: 'Strategy found no opportunity' });
        continue;
      }

      const tradeAmount = Math.min(decision.amount, balance - 5);
      if (tradeAmount < 5) {
        results.push({ agent: agent.name, status: 'skipped', reason: 'Balance too low after reserve' });
        continue;
      }

      const market = markets.find((m) => m.id === decision.marketId);
      if (!market) {
        results.push({ agent: agent.name, status: 'skipped', reason: 'Target market not found' });
        continue;
      }

      // Execute trade through AMM
      const yp = parseFloat(market.yes_pool);
      const np = parseFloat(market.no_pool);
      const { newYesPool, newNoPool, shares, newYesPrice, newNoPrice } = executeTrade(
        decision.side,
        tradeAmount,
        yp,
        np
      );
      const priceAtTrade = decision.side === 'YES' ? newYesPrice : newNoPrice;

      // Persist atomically
      const result = await prisma.$transaction(async (tx) => {
        const updatedAgent = await tx.agent.update({
          where: { id: agent.id },
          data: { balance: { decrement: tradeAmount } },
        });

        await tx.market.update({
          where: { id: market.id },
          data: { yes_pool: newYesPool, no_pool: newNoPool },
        });

        const trade = await tx.trade.create({
          data: {
            agent_id: agent.id,
            market_id: market.id,
            side: decision.side,
            amount: tradeAmount,
            shares: parseFloat(shares.toFixed(4)),
            price_at_trade: parseFloat(priceAtTrade.toFixed(4)),
          },
        });

        return { trade, updatedAgent };
      });

      // Update local market pools so the next agent sees updated state
      market.yes_pool = newYesPool;
      market.no_pool = newNoPool;

      results.push({
        agent: agent.name,
        status: 'traded',
        market: market.question,
        side: decision.side,
        amount: tradeAmount,
        shares: parseFloat(shares.toFixed(4)),
        price: parseFloat(priceAtTrade.toFixed(4)),
        reason: decision.reason,
        newBalance: parseFloat(result.updatedAgent.balance),
        tradeId: result.trade.id,
      });
    }

    return res.json({
      timestamp: new Date().toISOString(),
      tradesExecuted: results.filter((r) => r.status === 'traded').length,
      results,
    });
  } catch (err) {
    console.error('Agent run error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/* ──────────── POST /api/markets/sync ──────────── */

/**
 * Sync real markets from Polymarket into the internal system.
 * Creates new internal prediction markets based on live Polymarket data.
 */
router.post('/markets/sync', async (req, res) => {
  try {
    // Fetch live Polymarket data
    const polyRes = await fetch(
      'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=8&order=volume&ascending=false',
      { headers: { Accept: 'application/json' } }
    );

    if (!polyRes.ok) {
      return res.status(502).json({ error: `Polymarket API returned ${polyRes.status}` });
    }

    const polyMarkets = await polyRes.json();
    const list = Array.isArray(polyMarkets) ? polyMarkets : polyMarkets.markets || [];

    // Get the first agent as the market creator
    const creator = await prisma.agent.findFirst({ orderBy: { created_at: 'asc' } });
    if (!creator) {
      return res.status(400).json({ error: 'No agents exist to create markets' });
    }

    // Get existing market questions to avoid duplicates
    const existing = await prisma.market.findMany({ select: { question: true } });
    const existingSet = new Set(existing.map((m) => m.question.toLowerCase().trim()));

    const created = [];
    for (const pm of list) {
      const question = (pm.question || pm.title || '').trim();
      if (!question || existingSet.has(question.toLowerCase())) continue;

      // Set resolution date 30 days from now or use Polymarket's end date
      let resDate = new Date();
      resDate.setDate(resDate.getDate() + 30);
      if (pm.end_date_iso || pm.endDateIso) {
        const parsed = new Date(pm.end_date_iso || pm.endDateIso);
        if (!isNaN(parsed.getTime()) && parsed > new Date()) {
          resDate = parsed;
        }
      }

      try {
        const market = await prisma.market.create({
          data: {
            question: question.substring(0, 500),
            description: `Synced from Polymarket. Original volume: $${parseInt(pm.volume || pm.volumeNum || 0).toLocaleString()}`,
            creator_id: creator.id,
            yes_pool: 100,
            no_pool: 100,
            status: 'OPEN',
            resolution_date: resDate,
          },
        });
        created.push({ id: market.id, question: market.question });
        existingSet.add(question.toLowerCase());
      } catch (e) {
        // Skip duplicates
      }
    }

    return res.json({
      timestamp: new Date().toISOString(),
      source: 'polymarket',
      marketsChecked: list.length,
      marketsCreated: created.length,
      created,
    });
  } catch (err) {
    console.error('Market sync error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/* ──────────── GET /api/agents/status ──────────── */

router.get('/agents/status', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        _count: { select: { trades: true } },
        trades: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { created_at: true, side: true, amount: true },
        },
      },
    });

    const strategyDescriptions = {
      MarketMaker: 'Provides liquidity by buying the cheaper side of imbalanced markets',
      TrendFollower: 'Follows market momentum — buys the side with the most recent volume',
      Contrarian: 'Bets against crowd sentiment — buys the least popular side',
    };

    const result = agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      strategy: strategyDescriptions[a.name] || 'Custom strategy',
      balance: a.balance,
      trade_count: a._count.trades,
      last_trade: a.trades[0] || null,
    }));

    return res.json(result);
  } catch (err) {
    console.error('Agent status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
