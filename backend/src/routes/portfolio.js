import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/portfolio/:agentId
 * Return agent info, positions, trade history, and total PnL.
 */
router.get('/portfolio/:agentId', async (req, res) => {
  const { agentId } = req.params;

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        description: true,
        balance: true,
        created_at: true,
      },
    });

    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const trades = await prisma.trade.findMany({
      where: { agent_id: agentId },
      orderBy: { created_at: 'desc' },
      include: {
        market: {
          select: {
            id: true,
            question: true,
            status: true,
            yes_pool: true,
            no_pool: true,
          },
        },
      },
    });

    // Aggregate positions by market + side
    const positionMap = new Map();
    let totalAmountSpent = 0;
    let totalPayout = 0;

    for (const trade of trades) {
      const key = `${trade.market_id}:${trade.side}`;
      const existing = positionMap.get(key) || {
        market_id: trade.market_id,
        market_question: trade.market.question,
        market_status: trade.market.status,
        side: trade.side,
        total_shares: 0,
        total_amount: 0,
      };
      existing.total_shares += parseFloat(trade.shares);
      existing.total_amount += parseFloat(trade.amount);
      positionMap.set(key, existing);
      totalAmountSpent += parseFloat(trade.amount);
    }

    const positions = Array.from(positionMap.values()).map((pos) => ({
      ...pos,
      total_shares: parseFloat(pos.total_shares.toFixed(4)),
      total_amount: parseFloat(pos.total_amount.toFixed(2)),
    }));

    // Calculate PnL: winning trades in resolved markets
    for (const pos of positions) {
      const isWinner =
        (pos.side === 'YES' && pos.market_status === 'RESOLVED_YES') ||
        (pos.side === 'NO' && pos.market_status === 'RESOLVED_NO');
      if (isWinner) {
        totalPayout += pos.total_shares; // 1 token per share
      }
    }

    const total_pnl = parseFloat((totalPayout - totalAmountSpent).toFixed(2));

    const trade_history = trades.map((t) => ({
      id: t.id,
      market_id: t.market_id,
      market_question: t.market.question,
      side: t.side,
      amount: t.amount,
      shares: t.shares,
      price_at_trade: t.price_at_trade,
      created_at: t.created_at,
    }));

    return res.json({
      agent,
      positions,
      trade_history,
      total_pnl,
    });
  } catch (err) {
    console.error('Portfolio error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
