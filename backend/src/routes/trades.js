import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { executeTrade } from '../lib/amm.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/trade
 * Execute a trade on a market (authenticated).
 */
router.post('/trade', authenticate, async (req, res) => {
  const { market_id, side, amount, request_id } = req.body;

  if (!market_id) return res.status(400).json({ error: 'market_id is required' });
  if (!side || !['YES', 'NO'].includes(side.toUpperCase())) {
    return res.status(400).json({ error: 'side must be "YES" or "NO"' });
  }
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const tradeSide = side.toUpperCase();
  const tradeAmount = parseFloat(amount);

  // Idempotency check
  if (request_id) {
    const existing = await prisma.trade.findUnique({
      where: { request_id },
    });
    if (existing) {
      const agent = await prisma.agent.findUnique({ where: { id: req.agent.id } });
      const market = await prisma.market.findUnique({ where: { id: existing.market_id } });
      const yp = parseFloat(market.yes_pool);
      const np = parseFloat(market.no_pool);
      return res.json({
        trade_id: existing.id,
        shares_received: existing.shares,
        new_price: {
          yes: parseFloat((np / (yp + np)).toFixed(4)),
          no: parseFloat((yp / (yp + np)).toFixed(4)),
        },
        balance_remaining: agent.balance,
        idempotent: true,
      });
    }
  }

  try {
    const market = await prisma.market.findUnique({ where: { id: market_id } });

    if (!market) return res.status(404).json({ error: 'Market not found' });
    if (market.status !== 'OPEN') {
      return res.status(400).json({ error: 'Market is not open for trading' });
    }

    const agentBalance = parseFloat(req.agent.balance);
    if (agentBalance < tradeAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const yp = parseFloat(market.yes_pool);
    const np = parseFloat(market.no_pool);
    const { newYesPool, newNoPool, shares, newYesPrice, newNoPrice } = executeTrade(
      tradeSide,
      tradeAmount,
      yp,
      np
    );

    const priceAtTrade = tradeSide === 'YES' ? newYesPrice : newNoPrice;

    const result = await prisma.$transaction(async (tx) => {
      // Deduct balance
      const updatedAgent = await tx.agent.update({
        where: { id: req.agent.id },
        data: { balance: { decrement: tradeAmount } },
      });

      // Update market pools
      await tx.market.update({
        where: { id: market_id },
        data: {
          yes_pool: newYesPool,
          no_pool: newNoPool,
        },
      });

      // Create trade
      const trade = await tx.trade.create({
        data: {
          agent_id: req.agent.id,
          market_id,
          side: tradeSide,
          amount: tradeAmount,
          shares,
          price_at_trade: parseFloat(priceAtTrade.toFixed(4)),
          request_id: request_id || null,
        },
      });

      return { trade, updatedAgent };
    });

    return res.status(201).json({
      trade_id: result.trade.id,
      shares_received: parseFloat(parseFloat(result.trade.shares).toFixed(4)),
      new_price: {
        yes: parseFloat(newYesPrice.toFixed(4)),
        no: parseFloat(newNoPrice.toFixed(4)),
      },
      balance_remaining: result.updatedAgent.balance,
    });
  } catch (err) {
    console.error('Trade error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
