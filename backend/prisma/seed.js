import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// AMM helper functions (duplicated here to avoid import issues in seed)
function executeTrade(side, amount, yesPool, noPool) {
  const k = yesPool * noPool;
  let newYesPool, newNoPool, shares;

  if (side === 'YES') {
    newYesPool = yesPool + amount;
    newNoPool = k / newYesPool;
    shares = noPool - newNoPool;
  } else {
    newNoPool = noPool + amount;
    newYesPool = k / newNoPool;
    shares = yesPool - newYesPool;
  }

  const newYesPrice = newNoPool / (newYesPool + newNoPool);
  const newNoPrice = newYesPool / (newYesPool + newNoPool);

  return { newYesPool, newNoPool, shares, newYesPrice, newNoPrice };
}

async function main() {
  console.log('Seeding database...');

  // Clean existing seed data
  await prisma.trade.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.market.deleteMany();
  await prisma.agent.deleteMany();

  // Create agents
  const agentData = [
    { name: 'MarketMaker', description: 'Provides liquidity across all markets' },
    { name: 'TrendFollower', description: 'Follows market momentum' },
    { name: 'Contrarian', description: 'Bets against the crowd' },
  ];

  const agents = await Promise.all(
    agentData.map((a) =>
      prisma.agent.create({
        data: {
          name: a.name,
          description: a.description,
          api_key: crypto.randomBytes(32).toString('hex'),
          balance: 1000,
        },
      })
    )
  );

  const [marketMaker, trendFollower, contrarian] = agents;
  console.log(`Created ${agents.length} agents`);

  // Create markets
  const now = new Date();
  const marketsData = [
    {
      question: 'Will GPT-5 be released before July 2026?',
      description: 'OpenAI releases a model officially named GPT-5 to the public before July 1, 2026.',
      resolution_date: new Date('2026-07-01'),
    },
    {
      question: 'Will Bitcoin exceed $150,000 by end of 2026?',
      description: 'Bitcoin (BTC) reaches a price of $150,000 USD or higher on any major exchange before January 1, 2027.',
      resolution_date: new Date('2026-12-31'),
    },
    {
      question: 'Will a self-driving taxi service launch in 3+ US cities by 2026?',
      description: 'A fully autonomous (no safety driver) robotaxi service operates commercially in at least 3 US cities by end of 2026.',
      resolution_date: new Date('2026-12-31'),
    },
    {
      question: 'Will an AI agent win a competitive programming contest in 2026?',
      description: 'An AI agent achieves first place in a recognized competitive programming competition (e.g., Codeforces, LeetCode contest) in 2026.',
      resolution_date: new Date('2026-12-31'),
    },
    {
      question: 'Will global AI chip sales exceed $200B in 2026?',
      description: 'Annual global AI accelerator chip sales (GPUs, TPUs, and custom AI chips) exceed $200 billion USD in calendar year 2026.',
      resolution_date: new Date('2026-12-31'),
    },
  ];

  const markets = await Promise.all(
    marketsData.map((m) =>
      prisma.market.create({
        data: {
          question: m.question,
          description: m.description,
          creator_id: marketMaker.id,
          yes_pool: 100,
          no_pool: 100,
          status: 'OPEN',
          resolution_date: m.resolution_date,
        },
      })
    )
  );

  console.log(`Created ${markets.length} markets`);

  // Simulate 40 trades
  // We'll track pool states per market
  const poolState = {};
  markets.forEach((m) => {
    poolState[m.id] = { yesPool: 100, noPool: 100 };
  });

  // Track agent balances
  const balances = {
    [marketMaker.id]: 1000,
    [trendFollower.id]: 1000,
    [contrarian.id]: 1000,
  };

  // Define trades: [agentIndex, marketIndex, side, amount]
  // Bias: YES-heavy on markets 0,1,3; NO-heavy on markets 2,4
  const tradeSpecs = [
    // Market 0 (GPT-5): YES bias
    [1, 0, 'YES', 50], [0, 0, 'YES', 30], [2, 0, 'NO', 20],
    [1, 0, 'YES', 40], [0, 0, 'YES', 25], [2, 0, 'NO', 15],
    [1, 0, 'YES', 35], [2, 0, 'NO', 10],

    // Market 1 (Bitcoin): YES bias
    [0, 1, 'YES', 60], [1, 1, 'YES', 45], [2, 1, 'NO', 30],
    [0, 1, 'YES', 50], [1, 1, 'YES', 20], [2, 1, 'NO', 25],

    // Market 2 (Self-driving): NO bias
    [2, 2, 'NO', 55], [0, 2, 'NO', 40], [1, 2, 'YES', 20],
    [2, 2, 'NO', 35], [0, 2, 'NO', 30], [1, 2, 'YES', 15],

    // Market 3 (AI programming): YES bias
    [1, 3, 'YES', 70], [0, 3, 'YES', 40], [2, 3, 'NO', 25],
    [1, 3, 'YES', 30], [2, 3, 'NO', 20],

    // Market 4 (AI chip sales): NO bias
    [2, 4, 'NO', 60], [0, 4, 'NO', 45], [1, 4, 'YES', 30],
    [2, 4, 'NO', 40], [0, 4, 'NO', 20], [1, 4, 'YES', 10],

    // Additional mixed trades
    [0, 0, 'YES', 15], [1, 1, 'NO', 20], [2, 3, 'YES', 25],
    [0, 2, 'YES', 10], [1, 4, 'NO', 30], [2, 0, 'YES', 20],
    [0, 3, 'NO', 15], [1, 2, 'NO', 40], [2, 1, 'YES', 35],
  ];

  const agentList = [marketMaker, trendFollower, contrarian];
  let tradeCount = 0;

  for (const [agentIdx, marketIdx, side, amount] of tradeSpecs) {
    const agent = agentList[agentIdx];
    const market = markets[marketIdx];
    const { yesPool, noPool } = poolState[market.id];

    // Check if agent has balance
    if (balances[agent.id] < amount) continue;

    const { newYesPool, newNoPool, shares, newYesPrice, newNoPrice } = executeTrade(
      side,
      amount,
      yesPool,
      noPool
    );

    const priceAtTrade = side === 'YES' ? newYesPrice : newNoPrice;

    await prisma.$transaction(async (tx) => {
      await tx.agent.update({
        where: { id: agent.id },
        data: { balance: { decrement: amount } },
      });

      await tx.market.update({
        where: { id: market.id },
        data: {
          yes_pool: newYesPool,
          no_pool: newNoPool,
        },
      });

      await tx.trade.create({
        data: {
          agent_id: agent.id,
          market_id: market.id,
          side,
          amount,
          shares: parseFloat(shares.toFixed(4)),
          price_at_trade: parseFloat(priceAtTrade.toFixed(4)),
        },
      });
    });

    // Update local state
    poolState[market.id] = { yesPool: newYesPool, noPool: newNoPool };
    balances[agent.id] -= amount;
    tradeCount++;
  }

  console.log(`Created ${tradeCount} trades`);

  // Print final pool states
  for (const market of markets) {
    const { yesPool, noPool } = poolState[market.id];
    const yesP = (noPool / (yesPool + noPool) * 100).toFixed(1);
    console.log(`  Market "${market.question.substring(0, 40)}..." -> YES: ${yesP}%`);
  }

  console.log('\nSeed complete!');
  console.log('\nAgent API Keys:');
  agents.forEach((a) => console.log(`  ${a.name}: ${a.api_key}`));
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
