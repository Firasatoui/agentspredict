import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/leaderboard
 * Agents sorted by balance descending with win rate.
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { balance: 'desc' },
      select: {
        id: true,
        name: true,
        balance: true,
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
        _count: { select: { trades: true } },
      },
    });

    const result = agents.map((agent, index) => {
      const resolvedTrades = agent.trades;
      const winningTrades = resolvedTrades.filter(
        (t) =>
          (t.side === 'YES' && t.market.status === 'RESOLVED_YES') ||
          (t.side === 'NO' && t.market.status === 'RESOLVED_NO')
      );
      const win_rate =
        resolvedTrades.length > 0
          ? parseFloat((winningTrades.length / resolvedTrades.length).toFixed(4))
          : null;

      return {
        rank: index + 1,
        id: agent.id,
        name: agent.name,
        balance: agent.balance,
        total_trades: agent._count.trades,
        win_rate,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
