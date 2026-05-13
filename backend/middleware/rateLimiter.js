import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import {
  WINDOW_GLOBAL_MS, WINDOW_SCAN_MS, WINDOW_VOICE_MS,
  WINDOW_CHAT_MS, WINDOW_COMPARE_MS,
  LIMIT_GLOBAL_FREE, LIMIT_SCAN_FREE, LIMIT_VOICE_FREE,
  LIMIT_CHAT_FREE, LIMIT_COMPARE_FREE,
} from '../config/constants.js';

/**
 * Key generator: prefer authenticated UID over IP.
 * Using UID prevents IP-rotation abuse by authenticated users.
 * Unauthenticated requests are keyed by IP only.
 */
const userOrIpKey = (req) => req.user?.uid || req.ip;

/**
 * Log when a rate limit is hit — feeds abuse detection.
 */
function onLimitReached(req, res, options) {
  logger.warn('Rate limit hit', {
    ip:       req.ip,
    uid:      req.user?.uid || 'unauthenticated',
    path:     req.path,
    limit:    options.max,
    windowMs: options.windowMs,
  });
}

// ── Global limiter — ALL routes ───────────────────────────────────────────────
// Protects against general scraping and DDoS
export const globalLimiter = rateLimit({
  windowMs:        WINDOW_GLOBAL_MS,
  max:             LIMIT_GLOBAL_FREE,
  keyGenerator:    userOrIpKey,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    onLimitReached(req, res, { max: LIMIT_GLOBAL_FREE, windowMs: WINDOW_GLOBAL_MS });
    res.status(429).json({
      error:      'Too many requests. Please slow down.',
      retryAfter: Math.ceil(WINDOW_GLOBAL_MS / 1000 / 60) + ' minutes',
    });
  },
  // Premium users get 5× the global limit
  skip: (req) => req.user?.tier === 'premium',
});

// ── Strict auth limiter — prevents brute-force on token endpoints ─────────────
// Applied to any route that processes auth tokens
export const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes
  max:             20,               // 20 attempts per 15 min per IP
  keyGenerator:    (req) => req.ip,  // always key by IP for auth endpoints
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    logger.warn('Auth rate limit hit — possible brute force', { ip: req.ip, path: req.path });
    res.status(429).json({
      error: 'Too many authentication attempts. Try again in 15 minutes.',
    });
  },
});

// ── Scan limiter — POST /api/scan/analyze ─────────────────────────────────────
export const scanLimiter = rateLimit({
  windowMs:        WINDOW_SCAN_MS,
  max:             LIMIT_SCAN_FREE,
  keyGenerator:    userOrIpKey,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    onLimitReached(req, res, { max: LIMIT_SCAN_FREE, windowMs: WINDOW_SCAN_MS });
    res.status(429).json({
      error: `Scan limit reached (${LIMIT_SCAN_FREE}/hour on free tier).`,
      hint:  'Upgrade to premium for 50 scans/hour.',
    });
  },
  skip: (req) => req.user?.tier === 'premium',
});

// ── Voice limiter — POST /api/voice/generate ──────────────────────────────────
export const voiceLimiter = rateLimit({
  windowMs:        WINDOW_VOICE_MS,
  max:             LIMIT_VOICE_FREE,
  keyGenerator:    userOrIpKey,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    onLimitReached(req, res, { max: LIMIT_VOICE_FREE, windowMs: WINDOW_VOICE_MS });
    res.status(429).json({
      error: `Voice generation limit reached (${LIMIT_VOICE_FREE}/hour on free tier).`,
    });
  },
  skip: (req) => req.user?.tier === 'premium',
});

// ── Chat limiter — POST /api/chat/ask ─────────────────────────────────────────
export const chatLimiter = rateLimit({
  windowMs:        WINDOW_CHAT_MS,
  max:             LIMIT_CHAT_FREE,
  keyGenerator:    userOrIpKey,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    onLimitReached(req, res, { max: LIMIT_CHAT_FREE, windowMs: WINDOW_CHAT_MS });
    res.status(429).json({
      error: `Chat limit reached (${LIMIT_CHAT_FREE} questions/hour on free tier).`,
    });
  },
  skip: (req) => req.user?.tier === 'premium',
});

// ── Compare limiter — POST /api/compare/products ──────────────────────────────
export const compareLimiter = rateLimit({
  windowMs:        WINDOW_COMPARE_MS,
  max:             LIMIT_COMPARE_FREE,
  keyGenerator:    userOrIpKey,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    onLimitReached(req, res, { max: LIMIT_COMPARE_FREE, windowMs: WINDOW_COMPARE_MS });
    res.status(429).json({
      error: `Comparison limit reached (${LIMIT_COMPARE_FREE}/hour on free tier).`,
    });
  },
  skip: (req) => req.user?.tier === 'premium',
});
