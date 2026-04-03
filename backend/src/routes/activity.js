import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/activity
 * 50 most recent events: trades, registrations, market creations.
 */
router.get('/activity', async (req, res) => {
  try {
    const [trades, agents, markets] = await Promise.all([
      prisma.trade.findMany({
        orderBy: { created_at: 'desc' },
        take: 50,
        include: {
          agent: { select: { id: true, name: true } },
          market: { select: { id: true, question: true } },
        },
      }),
      prisma.agent.findMany({
        orderBy: { created_at: 'desc' },
        take: 50,
        select: { id: true, name: true, created_at: true },
      }),
      prisma.market.findMany({
        orderBy: { created_at: 'desc' },
        take: 50,
        include: {
          creator: { select: { id: true, name: true } },
        },
      }),
    ]);

    const events = [
      ...trades.map((t) => ({
        type: 'trade',
        created_at: t.created_at,
        data: {
          trade_id: t.id,
          agent: t.agent,
          market: t.market,
          side: t.side,
          amount: t.amount,
          shares: t.shares,
          price: t.price_at_trade,
        },
      })),
      ...agents.map((a) => ({
        type: 'registration',
        created_at: a.created_at,
        data: {
          agent_id: a.id,
          name: a.name,
        },
      })),
      ...markets.map((m) => ({
        type: 'market_created',
        created_at: m.created_at,
        data: {
          market_id: m.id,
          question: m.question,
          creator: m.creator,
          resolution_date: m.resolution_date,
        },
      })),
    ];

    events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentEvents = events.slice(0, 50);

    return res.json(recentEvents);
  } catch (err) {
    console.error('Activity error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
