import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { yesPrice, noPrice } from '../lib/amm.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/markets
 * List markets. Optional ?status=open
 */
router.get('/markets', async (req, res) => {
  const { status } = req.query;

  const where = {};
  if (status === 'open') {
    where.status = 'OPEN';
  }

  try {
    const markets = await prisma.market.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { trades: true } },
        trades: {
          select: { amount: true },
        },
      },
    });

    const result = markets.map((m) => {
      const yp = parseFloat(m.yes_pool);
      const np = parseFloat(m.no_pool);
      const totalVolume = m.trades.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0
      );

      return {
        id: m.id,
        question: m.question,
        description: m.description,
        creator: m.creator,
        yes_pool: m.yes_pool,
        no_pool: m.no_pool,
        yes_price: parseFloat(yesPrice(yp, np).toFixed(4)),
        no_price: parseFloat(noPrice(yp, np).toFixed(4)),
        status: m.status,
        resolution_date: m.resolution_date,
        created_at: m.created_at,
        trade_count: m._count.trades,
        total_volume: parseFloat(totalVolume.toFixed(2)),
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Get markets error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/markets/:id
 * Get a single market with full details, price history, and participants.
 */
router.get('/markets/:id', async (req, res) => {
  try {
    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true } },
        trades: {
          orderBy: { created_at: 'desc' },
          take: 50,
          include: {
            agent: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const yp = parseFloat(market.yes_pool);
    const np = parseFloat(market.no_pool);

    // Price history from last 50 trades
    const price_history = market.trades.map((t) => ({
      trade_id: t.id,
      agent: t.agent,
      side: t.side,
      amount: t.amount,
      shares: t.shares,
      price: t.price_at_trade,
      created_at: t.created_at,
    }));

    // Distinct participants
    const participantMap = new Map();
    market.trades.forEach((t) => {
      if (!participantMap.has(t.agent.id)) {
        participantMap.set(t.agent.id, t.agent);
      }
    });
    const participants = Array.from(participantMap.values());

    // Total volume
    const totalVolume = market.trades.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );

    return res.json({
      id: market.id,
      question: market.question,
      description: market.description,
      creator: market.creator,
      yes_pool: market.yes_pool,
      no_pool: market.no_pool,
      yes_price: parseFloat(yesPrice(yp, np).toFixed(4)),
      no_price: parseFloat(noPrice(yp, np).toFixed(4)),
      status: market.status,
      resolution_date: market.resolution_date,
      created_at: market.created_at,
      trade_count: market.trades.length,
      total_volume: parseFloat(totalVolume.toFixed(2)),
      price_history,
      participants,
    });
  } catch (err) {
    console.error('Get market error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/markets
 * Create a new market (authenticated).
 */
router.post('/markets', authenticate, async (req, res) => {
  const { question, description, resolution_date } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'question is required' });
  }
  if (!resolution_date) {
    return res.status(400).json({ error: 'resolution_date is required' });
  }

  const resolvedDate = new Date(resolution_date);
  if (isNaN(resolvedDate.getTime())) {
    return res.status(400).json({ error: 'resolution_date must be a valid date' });
  }

  try {
    const market = await prisma.market.create({
      data: {
        question: question.trim(),
        description: description || null,
        creator_id: req.agent.id,
        yes_pool: 100,
        no_pool: 100,
        status: 'OPEN',
        resolution_date: resolvedDate,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    const yp = parseFloat(market.yes_pool);
    const np = parseFloat(market.no_pool);

    return res.status(201).json({
      id: market.id,
      question: market.question,
      description: market.description,
      creator: market.creator,
      yes_pool: market.yes_pool,
      no_pool: market.no_pool,
      yes_price: parseFloat(yesPrice(yp, np).toFixed(4)),
      no_price: parseFloat(noPrice(yp, np).toFixed(4)),
      status: market.status,
      resolution_date: market.resolution_date,
      created_at: market.created_at,
    });
  } catch (err) {
    console.error('Create market error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/markets/:id/resolve
 * Resolve a market (authenticated, creator only).
 */
router.post('/markets/:id/resolve', authenticate, async (req, res) => {
  const { outcome } = req.body;

  if (!outcome || !['yes', 'no'].includes(outcome.toLowerCase())) {
    return res.status(400).json({ error: 'outcome must be "yes" or "no"' });
  }

  const outcomeUpper = outcome.toUpperCase();

  try {
    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
    });

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    if (market.creator_id !== req.agent.id) {
      return res.status(403).json({ error: 'Only the market creator can resolve this market' });
    }

    if (market.status !== 'OPEN') {
      return res.status(400).json({ error: 'Market is not open' });
    }

    const newStatus = outcomeUpper === 'YES' ? 'RESOLVED_YES' : 'RESOLVED_NO';

    // Get all winning trades
    const winningTrades = await prisma.trade.findMany({
      where: {
        market_id: market.id,
        side: outcomeUpper,
      },
      select: {
        agent_id: true,
        shares: true,
      },
    });

    // Aggregate payouts per agent
    const payoutMap = new Map();
    for (const trade of winningTrades) {
      const current = payoutMap.get(trade.agent_id) || 0;
      payoutMap.set(trade.agent_id, current + parseFloat(trade.shares));
    }

    // Run transaction: update market status + distribute payouts
    await prisma.$transaction(async (tx) => {
      await tx.market.update({
        where: { id: market.id },
        data: { status: newStatus },
      });

      for (const [agentId, shares] of payoutMap.entries()) {
        await tx.agent.update({
          where: { id: agentId },
          data: { balance: { increment: shares } },
        });
      }
    });

    return res.json({
      market_id: market.id,
      status: newStatus,
      outcome: outcomeUpper,
      payouts_distributed: payoutMap.size,
    });
  } catch (err) {
    console.error('Resolve market error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
