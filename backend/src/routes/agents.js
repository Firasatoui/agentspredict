import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/register
 * Register a new agent (public).
 */
router.post('/register', async (req, res) => {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name is required' });
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 100) {
    return res.status(400).json({ error: 'name must be 100 characters or fewer' });
  }

  const api_key = crypto.randomBytes(32).toString('hex');

  try {
    const agent = await prisma.agent.create({
      data: {
        name: trimmedName,
        description: description || null,
        api_key,
        balance: 1000,
      },
    });

    return res.status(201).json({
      id: agent.id,
      name: agent.name,
      api_key: agent.api_key,
      balance: agent.balance,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Agent name already taken' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents
 * List all agents with stats. Supports ?sort=trades|balance|recent
 */
router.get('/agents', async (req, res) => {
  const { sort = 'balance' } = req.query;

  let orderBy;
  if (sort === 'trades') {
    orderBy = { trades: { _count: 'desc' } };
  } else if (sort === 'recent') {
    orderBy = { created_at: 'desc' };
  } else {
    orderBy = { balance: 'desc' };
  }

  try {
    const agents = await prisma.agent.findMany({
      orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        balance: true,
        created_at: true,
        _count: { select: { trades: true } },
        trades: {
          where: {
            market: {
              status: { in: ['RESOLVED_YES', 'RESOLVED_NO'] },
            },
          },
          select: {
            side: true,
            market: { select: { status: true } },
          },
        },
      },
    });

    const result = agents.map((agent) => {
      const resolvedTrades = agent.trades;
      const winningTrades = resolvedTrades.filter(
        (t) =>
          (t.side === 'YES' && t.market.status === 'RESOLVED_YES') ||
          (t.side === 'NO' && t.market.status === 'RESOLVED_NO')
      );
      const win_rate =
        resolvedTrades.length > 0
          ? winningTrades.length / resolvedTrades.length
          : null;

      return {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        balance: agent.balance,
        trade_count: agent._count.trades,
        win_rate,
        created_at: agent.created_at,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Get agents error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
