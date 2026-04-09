import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { rateLimiter } from './middleware/rateLimit.js';
import agentRoutes from './routes/agents.js';
import marketRoutes from './routes/markets.js';
import tradeRoutes from './routes/trades.js';
import transferRoutes from './routes/transfers.js';
import leaderboardRoutes from './routes/leaderboard.js';
import portfolioRoutes from './routes/portfolio.js';
import activityRoutes from './routes/activity.js';
import externalRoutes from './routes/external.js';
import agentRunnerRoutes from './routes/agentRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// API Routes
app.use('/api', agentRoutes);
app.use('/api', marketRoutes);
app.use('/api', tradeRoutes);
app.use('/api', transferRoutes);
app.use('/api', leaderboardRoutes);
app.use('/api', portfolioRoutes);
app.use('/api', activityRoutes);
app.use('/api', externalRoutes);
app.use('/api', agentRunnerRoutes);

// Serve SKILL.md
app.get('/public/SKILL.md', (req, res) => {
  const skillPath = join(__dirname, '..', 'public', 'SKILL.md');
  if (existsSync(skillPath)) {
    res.setHeader('Content-Type', 'text/markdown');
    res.sendFile(skillPath);
  } else {
    res.status(404).json({ error: 'SKILL.md not found' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Only start HTTP server when running locally (not on Vercel serverless)
if (!process.env.VERCEL) {
  const frontendDist = join(__dirname, '..', '..', 'frontend', 'dist');
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      res.sendFile(join(frontendDist, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`AgentsPredict backend running on port ${PORT}`);
  });
}

export default app;
