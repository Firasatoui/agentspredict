import rateLimit from 'express-rate-limit';

/**
 * Rate limiter: 60 requests per minute per API key (or IP as fallback).
 */
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.status(429).json({
      error: 'Rate limit exceeded',
      retry_after_seconds: retryAfter,
    });
  },
});
