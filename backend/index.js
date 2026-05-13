import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { initFirebase } from './config/firebase.js';
import { initGemini } from './config/gemini.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { sanitizeAll } from './middleware/sanitize.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// ── Route imports ─────────────────────────────────────────────────────────────
import scanRoutes       from './routes/scan.routes.js';
import userRoutes       from './routes/user.routes.js';
import nutritionRoutes  from './routes/nutrition.routes.js';
import voiceRoutes      from './routes/voice.routes.js';
import compareRoutes    from './routes/compare.routes.js';
import chatRoutes       from './routes/chat.routes.js';
import barcodeRoutes    from './routes/barcode.routes.js';
import moodRoutes       from './routes/mood.routes.js';
import budgetRoutes     from './routes/budget.routes.js';
import supplementRoutes from './routes/supplement.routes.js';
import plateRoutes      from './routes/plate.routes.js';
import riskRoutes       from './routes/risk.routes.js';
import groceryRoutes    from './routes/grocery.routes.js';
import communityRoutes  from './routes/community.routes.js';
import moodRoutes      from './routes/mood.routes.js';
import budgetRoutes    from './routes/budget.routes.js';
import supplementRoutes from './routes/supplement.routes.js';
import plateRoutes     from './routes/plate.routes.js';
import riskRoutes      from './routes/risk.routes.js';

// ── Validate required env vars at startup ─────────────────────────────────────
function validateEnv() {
  const required = [
    'GEMINI_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(`Missing required env vars: ${missing.join(', ')} — refusing to start`);
      process.exit(1);
    } else {
      logger.warn(`Missing env vars (dev mode): ${missing.join(', ')}`);
    }
  }
}

validateEnv();

// ── Initialize external services ──────────────────────────────────────────────
initFirebase();
initGemini();

// ── Create Express app ────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Trust proxy headers only in production (needed for correct req.ip behind Render/Vercel)
if (isProd) app.set('trust proxy', 1);

// ── Helmet — security headers ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'none'"],
      connectSrc:  ["'self'"],
      // API server serves no HTML/scripts — strict CSP
    },
  },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));

// Additional custom security headers
app.use(securityHeaders);

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production, only allow the exact frontend origin
// In development, also allow localhost variants
const allowedOrigins = isProd
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:4173',
      // Allow any local network IP for mobile testing
      // Vite will print the exact network URL when it starts
    ].filter(Boolean);

// In development, also allow any 192.168.x.x or 10.x.x.x origin
const isLocalNetwork = (origin) =>
  /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin only in development (curl, Postman)
    if (!origin) {
      if (isProd) return callback(new Error('CORS: direct requests not allowed in production'));
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn('CORS: blocked request from unknown origin', { origin });
    callback(new Error('CORS: origin not allowed'));
  },
  credentials:     true,
  methods:         ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization'],
  exposedHeaders:  ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge:          600, // preflight cache 10 minutes
}));

// ── Request logging ───────────────────────────────────────────────────────────
// In production use 'combined' format for full access logs; 'dev' in development
app.use(morgan(isProd ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  // Skip health check spam in logs
  skip: (req) => req.path === '/api/health' && req.method === 'GET',
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
// Tight limits — API only accepts small JSON payloads
// Multipart (images) handled by multer per-route
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

// ── Global sanitization — runs on every request ───────────────────────────────
app.use(sanitizeAll);

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Health check (no auth, no rate limit) ────────────────────────────────────
// Returns minimal info — does NOT expose env, version, or internal state
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/scan',       scanRoutes);
app.use('/api/user',       userRoutes);
app.use('/api/nutrition',  nutritionRoutes);
app.use('/api/voice',      voiceRoutes);
app.use('/api/compare',    compareRoutes);
app.use('/api/chat',       chatRoutes);
app.use('/api/barcode',    barcodeRoutes);
app.use('/api/mood',       moodRoutes);
app.use('/api/budget',     budgetRoutes);
app.use('/api/supplement', supplementRoutes);
app.use('/api/plate',      plateRoutes);
app.use('/api/risk',       riskRoutes);
app.use('/api/grocery',    groceryRoutes);
app.use('/api/community',  communityRoutes);// ── 404 + Error handlers (must be last) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`ScanAndSee API started on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// ── Unhandled rejection / exception logging ───────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

export default app;
