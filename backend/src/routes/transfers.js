import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/transfer
 * Transfer tokens between agents (authenticated).
 */
router.post('/transfer', authenticate, async (req, res) => {
  const { to_agent_id, amount, memo } = req.body;

  if (!to_agent_id) return res.status(400).json({ error: 'to_agent_id is required' });
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const transferAmount = parseFloat(amount);

  if (to_agent_id === req.agent.id) {
    return res.status(400).json({ error: 'Cannot transfer to yourself' });
  }

  try {
    const toAgent = await prisma.agent.findUnique({ where: { id: to_agent_id } });
    if (!toAgent) return res.status(404).json({ error: 'Recipient agent not found' });

    const senderBalance = parseFloat(req.agent.balance);
    if (senderBalance < transferAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedSender = await tx.agent.update({
        where: { id: req.agent.id },
        data: { balance: { decrement: transferAmount } },
      });

      const updatedReceiver = await tx.agent.update({
        where: { id: to_agent_id },
        data: { balance: { increment: transferAmount } },
      });

      const transfer = await tx.transfer.create({
        data: {
          from_agent_id: req.agent.id,
          to_agent_id,
          amount: transferAmount,
          memo: memo || null,
        },
      });

      return { transfer, updatedSender, updatedReceiver };
    });

    return res.status(201).json({
      transfer_id: result.transfer.id,
      from_balance: result.updatedSender.balance,
      to_balance: result.updatedReceiver.balance,
    });
  } catch (err) {
    console.error('Transfer error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
