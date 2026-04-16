import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { executeTrade, yesPrice, noPrice } from '../lib/amm.js';

const router = Router();
const prisma = new PrismaClient();

/* ──────────── Agent Strategies ──────────── */

/**
 * Each strategy is a function(markets, recentTrades, opts) that returns
 * { marketId, side, amount, reason } or null (skip this round).
 *
 * opts.riskMultiplier (default 1.0) scales trade sizes.
 * opts.threshold (default varies) adjusts entry sensitivity.
 */

const strategies = {
  MarketMaker(markets, _recentTrades, opts = {}) {
    const riskMul = opts.riskMultiplier || 1.0;
    const threshold = opts.threshold || 0.02;
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

    if (!bestMarket || maxImbalance < threshold) return null;

    const yp = parseFloat(bestMarket.yes_pool);
    const np = parseFloat(bestMarket.no_pool);
    const side = yp > np ? 'YES' : 'NO';
    const amount = Math.round(Math.min(15 + Math.floor(Math.random() * 20), 35) * riskMul);

    return {
      marketId: bestMarket.id,
      side,
      amount,
      reason: `Providing liquidity on ${side} side (imbalance: ${(maxImbalance * 100).toFixed(1)}%, risk: ${riskMul}x)`,
    };
  },

  TrendFollower(markets, recentTrades, opts = {}) {
    const riskMul = opts.riskMultiplier || 1.0;
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
      const m = markets[Math.floor(Math.random() * markets.length)];
      const yp = parseFloat(m.yes_pool);
      const np = parseFloat(m.no_pool);
      return {
        marketId: m.id,
        side: yp > np ? 'YES' : 'NO',
        amount: Math.round(20 * riskMul),
        reason: `No trend data -- following price signal (risk: ${riskMul}x)`,
      };
    }

    const amount = Math.round(Math.min(20 + Math.floor(Math.random() * 25), 45) * riskMul);
    return {
      marketId: bestMarket.id,
      side: bestSide,
      amount,
      reason: `Following ${bestSide} momentum (volume: ${bestScore.toFixed(0)}, risk: ${riskMul}x)`,
    };
  },

  Contrarian(markets, _recentTrades, opts = {}) {
    const riskMul = opts.riskMultiplier || 1.0;
    const threshold = opts.threshold || 0.02;
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
        bestSide = yPx < 0.5 ? 'YES' : 'NO';
      }
    }

    if (!bestMarket || bestScore < threshold) return null;

    const amount = Math.round(Math.min(15 + Math.floor(Math.random() * 20), 35) * riskMul);
    return {
      marketId: bestMarket.id,
      side: bestSide,
      amount,
      reason: `Contrarian bet on ${bestSide} (market is ${(bestScore * 200).toFixed(0)}% one-sided, risk: ${riskMul}x)`,
    };
  },

  AggressiveTrader(markets, recentTrades, opts = {}) {
    const riskMul = opts.riskMultiplier || 2.0;
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
      const m = markets[Math.floor(Math.random() * markets.length)];
      const yp = parseFloat(m.yes_pool);
      const np = parseFloat(m.no_pool);
      return {
        marketId: m.id,
        side: yp > np ? 'YES' : 'NO',
        amount: Math.round(50 * riskMul),
        reason: `AGGRESSIVE: No trend -- doubling down on price signal (risk: ${riskMul}x)`,
      };
    }

    const amount = Math.round(Math.min(40 + Math.floor(Math.random() * 50), 90) * riskMul);
    return {
      marketId: bestMarket.id,
      side: bestSide,
      amount,
      reason: `AGGRESSIVE: Following ${bestSide} momentum (volume: ${bestScore.toFixed(0)}, risk: ${riskMul}x)`,
    };
  },

  ConservativeTrader(markets, _recentTrades, opts = {}) {
    const riskMul = opts.riskMultiplier || 0.5;
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

    if (!bestMarket || maxImbalance < 0.01) return null;

    const yp = parseFloat(bestMarket.yes_pool);
    const np = parseFloat(bestMarket.no_pool);
    const side = yp > np ? 'YES' : 'NO';
    const amount = Math.round(Math.min(5 + Math.floor(Math.random() * 10), 15) * riskMul);

    return {
      marketId: bestMarket.id,
      side,
      amount,
      reason: `CONSERVATIVE: Small liquidity provision on ${side} (imbalance: ${(maxImbalance * 100).toFixed(1)}%, risk: ${riskMul}x)`,
    };
  },

  RandomAgent(markets, _recentTrades, opts = {}) {
    const riskMul = opts.riskMultiplier || 1.0;
    const m = markets[Math.floor(Math.random() * markets.length)];
    const side = Math.random() > 0.5 ? 'YES' : 'NO';
    const amount = Math.round((10 + Math.floor(Math.random() * 25)) * riskMul);

    return {
      marketId: m.id,
      side,
      amount,
      reason: `RANDOM: ${side} on random market (baseline control, risk: ${riskMul}x)`,
    };
  },
};

/**
 * Resolve an agent's strategy. Supports:
 *   - Exact name match: "MarketMaker"
 *   - Parameterized names: "MarketMaker_v3" -> MarketMaker with variant seed
 *   - Description-based: agent.description containing "strategy:TrendFollower"
 */
function resolveStrategy(agent) {
  // Exact match
  if (strategies[agent.name]) return { fn: strategies[agent.name], opts: {} };

  // Parameterized: "StrategyName_vN" or "StrategyName_suffix"
  const parts = agent.name.split('_');
  const baseName = parts[0];
  if (strategies[baseName]) {
    // Extract risk multiplier from variant number for diversity
    const variantNum = parseInt(parts[1]?.replace('v', '')) || 1;
    const riskVariants = [0.3, 0.5, 0.7, 1.0, 1.3, 1.5, 1.8, 2.0, 2.5, 3.0];
    const riskMul = riskVariants[(variantNum - 1) % riskVariants.length];
    return { fn: strategies[baseName], opts: { riskMultiplier: riskMul } };
  }

  // Description-based
  if (agent.description) {
    const match = agent.description.match(/strategy:(\w+)/);
    if (match && strategies[match[1]]) {
      return { fn: strategies[match[1]], opts: {} };
    }
  }

  return null;
}

/* ──────────── POST /api/agents/run ──────────── */

router.post('/agents/run', async (req, res) => {
  try {
    const memoryless = req.query.memoryless === 'true';

    const [agents, markets, recentTrades] = await Promise.all([
      prisma.agent.findMany(),
      prisma.market.findMany({ where: { status: 'OPEN' } }),
      memoryless
        ? Promise.resolve([])
        : prisma.trade.findMany({ orderBy: { created_at: 'desc' }, take: 200 }),
    ]);

    if (markets.length === 0) {
      return res.json({ timestamp: new Date().toISOString(), message: 'No open markets to trade', tradesExecuted: 0, results: [] });
    }

    const results = [];
    const startTime = Date.now();

    for (const agent of agents) {
      const resolved = resolveStrategy(agent);
      if (!resolved) {
        results.push({ agent: agent.name, status: 'skipped', reason: 'No strategy defined' });
        continue;
      }

      const balance = parseFloat(agent.balance);
      if (balance < 5) {
        results.push({ agent: agent.name, status: 'skipped', reason: `Insufficient balance ($${balance.toFixed(0)})` });
        continue;
      }

      const decision = resolved.fn(markets, recentTrades, resolved.opts);
      if (!decision) {
        results.push({ agent: agent.name, status: 'skipped', reason: 'Strategy found no opportunity' });
        continue;
      }

      const tradeAmount = Math.min(decision.amount, balance - 2);
      if (tradeAmount < 2) {
        results.push({ agent: agent.name, status: 'skipped', reason: 'Balance too low after reserve' });
        continue;
      }

      const market = markets.find((m) => m.id === decision.marketId);
      if (!market) {
        results.push({ agent: agent.name, status: 'skipped', reason: 'Target market not found' });
        continue;
      }

      const yp = parseFloat(market.yes_pool);
      const np = parseFloat(market.no_pool);
      const { newYesPool, newNoPool, shares, newYesPrice, newNoPrice } = executeTrade(
        decision.side,
        tradeAmount,
        yp,
        np
      );
      const priceAtTrade = decision.side === 'YES' ? newYesPrice : newNoPrice;

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

    const elapsed = Date.now() - startTime;

    return res.json({
      timestamp: new Date().toISOString(),
      memoryless: memoryless,
      totalAgents: agents.length,
      tradesExecuted: results.filter((r) => r.status === 'traded').length,
      executionTimeMs: elapsed,
      results,
    });
  } catch (err) {
    console.error('Agent run error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/* ──────────── POST /api/agents/scale ──────────── */

/**
 * Register N parameterized agents for scale testing.
 * Body: { count: 30, startingBalance: 1000 }
 * Creates variants like MarketMaker_v1, TrendFollower_v2, etc.
 */
router.post('/agents/scale', async (req, res) => {
  try {
    const { count = 30, startingBalance = 1000 } = req.body || {};
    const maxAgents = Math.min(Math.max(1, parseInt(count)), 100);

    const baseStrategies = Object.keys(strategies);
    const created = [];
    const skipped = [];

    for (let i = 1; i <= maxAgents; i++) {
      const baseStrategy = baseStrategies[(i - 1) % baseStrategies.length];
      const variantNum = Math.ceil(i / baseStrategies.length);
      const name = `${baseStrategy}_v${variantNum}`;

      // Check if already exists
      const existing = await prisma.agent.findFirst({ where: { name } });
      if (existing) {
        skipped.push(name);
        continue;
      }

      const riskVariants = [0.3, 0.5, 0.7, 1.0, 1.3, 1.5, 1.8, 2.0, 2.5, 3.0];
      const riskMul = riskVariants[(variantNum - 1) % riskVariants.length];

      const agent = await prisma.agent.create({
        data: {
          name,
          description: `strategy:${baseStrategy} | Scale variant ${variantNum} | risk: ${riskMul}x`,
          balance: startingBalance,
          api_key: `scale_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 8)}`,
        },
      });

      created.push({ id: agent.id, name: agent.name, riskMultiplier: riskMul });
    }

    const totalAgents = await prisma.agent.count();

    return res.json({
      timestamp: new Date().toISOString(),
      requested: maxAgents,
      created: created.length,
      skipped: skipped.length,
      totalAgentsNow: totalAgents,
      agents: created,
    });
  } catch (err) {
    console.error('Scale error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/* ──────────── POST /api/experiments/run ──────────── */

/**
 * Run a multi-round experiment at scale.
 * Body: { rounds: number, memoryless?: boolean, resetBalances?: boolean }
 * Returns round-by-round results and timing metrics.
 */
router.post('/experiments/run', async (req, res) => {
  try {
    const { rounds = 5, memoryless = false, resetBalances = true } = req.body || {};
    const numRounds = Math.min(Math.max(1, parseInt(rounds)), 50);

    if (resetBalances) {
      await prisma.agent.updateMany({ data: { balance: 1000 } });
    }

    const experimentResults = [];
    const overallStart = Date.now();

    for (let round = 1; round <= numRounds; round++) {
      const roundStart = Date.now();

      const [agents, markets, recentTrades] = await Promise.all([
        prisma.agent.findMany(),
        prisma.market.findMany({ where: { status: 'OPEN' } }),
        memoryless
          ? Promise.resolve([])
          : prisma.trade.findMany({ orderBy: { created_at: 'desc' }, take: 200 }),
      ]);

      if (markets.length === 0) break;

      const roundResults = [];
      let tradesThisRound = 0;
      let errorsThisRound = 0;

      for (const agent of agents) {
        const resolved = resolveStrategy(agent);
        if (!resolved) {
          roundResults.push({ agent: agent.name, status: 'skipped', reason: 'No strategy', balance: parseFloat(agent.balance) });
          continue;
        }

        const balance = parseFloat(agent.balance);
        if (balance < 5) {
          roundResults.push({ agent: agent.name, status: 'skipped', reason: 'Low balance', balance });
          continue;
        }

        const decision = resolved.fn(markets, recentTrades, resolved.opts);
        if (!decision) {
          roundResults.push({ agent: agent.name, status: 'skipped', reason: 'No opportunity', balance });
          continue;
        }

        const tradeAmount = Math.min(decision.amount, balance - 2);
        if (tradeAmount < 2) {
          roundResults.push({ agent: agent.name, status: 'skipped', reason: 'Low balance', balance });
          continue;
        }

        const market = markets.find((m) => m.id === decision.marketId);
        if (!market) continue;

        try {
          const yp = parseFloat(market.yes_pool);
          const np = parseFloat(market.no_pool);
          const { newYesPool, newNoPool, shares, newYesPrice, newNoPrice } = executeTrade(
            decision.side,
            tradeAmount,
            yp,
            np
          );
          const priceAtTrade = decision.side === 'YES' ? newYesPrice : newNoPrice;

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

          market.yes_pool = newYesPool;
          market.no_pool = newNoPool;
          tradesThisRound++;

          roundResults.push({
            agent: agent.name,
            status: 'traded',
            side: decision.side,
            amount: tradeAmount,
            shares: parseFloat(shares.toFixed(4)),
            price: parseFloat(priceAtTrade.toFixed(4)),
            reason: decision.reason,
            balance: parseFloat(result.updatedAgent.balance),
          });
        } catch (tradeErr) {
          errorsThisRound++;
          roundResults.push({
            agent: agent.name,
            status: 'error',
            error: tradeErr.message,
            balance: parseFloat(agent.balance),
          });
        }
      }

      const roundMs = Date.now() - roundStart;

      experimentResults.push({
        round,
        trades: tradesThisRound,
        errors: errorsThisRound,
        agentsActive: roundResults.filter(r => r.status === 'traded').length,
        agentsSkipped: roundResults.filter(r => r.status === 'skipped').length,
        roundTimeMs: roundMs,
        results: roundResults,
      });
    }

    const totalMs = Date.now() - overallStart;

    // Get final balances
    const finalAgents = await prisma.agent.findMany({
      select: { name: true, balance: true, _count: { select: { trades: true } } },
      orderBy: { balance: 'desc' },
    });

    const summary = finalAgents.map(a => ({
      agent: a.name,
      finalBalance: parseFloat(a.balance),
      pnl: parseFloat(a.balance) - 1000,
      totalTrades: a._count.trades,
    }));

    // Compute scale metrics
    const totalTrades = experimentResults.reduce((s, r) => s + r.trades, 0);
    const totalErrors = experimentResults.reduce((s, r) => s + r.errors, 0);
    const avgRoundMs = totalMs / experimentResults.length;

    return res.json({
      timestamp: new Date().toISOString(),
      config: { rounds: numRounds, memoryless, resetBalances },
      scaleMetrics: {
        totalAgents: finalAgents.length,
        totalRounds: experimentResults.length,
        totalTrades,
        totalErrors,
        totalTimeMs: totalMs,
        avgRoundTimeMs: Math.round(avgRoundMs),
        tradesPerSecond: totalTrades / (totalMs / 1000),
      },
      rounds: experimentResults,
      summary,
    });
  } catch (err) {
    console.error('Experiment run error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/* ──────────── POST /api/experiments/reset ──────────── */

router.post('/experiments/reset', async (req, res) => {
  try {
    const { clearTrades = false, balance = 1000, removeScaleAgents = false } = req.body || {};
    
    if (clearTrades) {
      await prisma.trade.deleteMany({});
    }

    if (removeScaleAgents) {
      // Remove parameterized agents, keep originals
      await prisma.trade.deleteMany({
        where: { agent: { name: { contains: '_v' } } },
      });
      await prisma.agent.deleteMany({
        where: { name: { contains: '_v' } },
      });
    }
    
    await prisma.agent.updateMany({ data: { balance } });
    
    const agents = await prisma.agent.findMany({ select: { name: true, balance: true } });
    
    return res.json({
      timestamp: new Date().toISOString(),
      reset: true,
      clearedTrades: clearTrades,
      removedScaleAgents: removeScaleAgents,
      agentCount: agents.length,
      agents: agents.map(a => ({ name: a.name, balance: parseFloat(a.balance) })),
    });
  } catch (err) {
    console.error('Reset error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/* ──────────── POST /api/markets/sync ──────────── */

router.post('/markets/sync', async (req, res) => {
  try {
    const polyRes = await fetch(
      'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=20&order=volume&ascending=false',
      { headers: { Accept: 'application/json' } }
    );

    if (!polyRes.ok) {
      return res.status(502).json({ error: `Polymarket API returned ${polyRes.status}` });
    }

    const polyMarkets = await polyRes.json();
    const list = Array.isArray(polyMarkets) ? polyMarkets : polyMarkets.markets || [];

    const creator = await prisma.agent.findFirst({ orderBy: { created_at: 'asc' } });
    if (!creator) {
      return res.status(400).json({ error: 'No agents exist to create markets' });
    }

    const existing = await prisma.market.findMany({ select: { question: true } });
    const existingSet = new Set(existing.map((m) => m.question.toLowerCase().trim()));

    const created = [];
    for (const pm of list) {
      const question = (pm.question || pm.title || '').trim();
      if (!question || existingSet.has(question.toLowerCase())) continue;

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
      TrendFollower: 'Follows market momentum -- buys the side with the most recent volume',
      Contrarian: 'Bets against crowd sentiment -- buys the least popular side',
      AggressiveTrader: 'High-risk momentum follower with 2x trade sizes',
      ConservativeTrader: 'Low-risk liquidity provider with 0.5x trade sizes',
      RandomAgent: 'Random baseline control -- no strategy, pure noise',
    };

    const result = agents.map((a) => {
      const baseName = a.name.split('_')[0];
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        strategy: strategyDescriptions[baseName] || strategyDescriptions[a.name] || 'Custom strategy',
        balance: a.balance,
        trade_count: a._count.trades,
        last_trade: a.trades[0] || null,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Agent status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
