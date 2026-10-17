import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// keyed by authenticated user id when present (v6-safe: flattened via ipKeyGenerator)
const userKey = (req) => (req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req.ip));

const json = (message) => ({
  statusCode: 429,
  message,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: json('Too many auth attempts. Try again in a few minutes.'),
  skipSuccessfulRequests: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 240,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: json('Too many requests'),
});

export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: userKey,
  message: json('AI tutor rate limit: max 10 requests per minute'),
});

export const challengeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: userKey,
  message: json('Too many submissions — slow down and think it through'),
});
