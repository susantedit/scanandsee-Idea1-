import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { initFirebase } from './config/firebase.js';
import { initGemini } from './config/gemini.js';
import { initGroq } from './config/groq.js';
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
import classifyRoutes   from './routes/classify.routes.js';
import adminRoutes      from './routes/admin.routes.js';

// ── Validate required env vars ────────────────────────────────────────────────
function validateEnv() {
  const required = ['GEMINI_API_KEY', 'FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
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
initGroq(); // multi-key Groq for text AI (chat, mood, budget, risk)

// ── Create Express app ────────────────────────────────────────────────────────
const app    = express();
const PORT   = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

if (isProd) app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'none'"], connectSrc: ["'self'"] },
  },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));
app.use(securityHeaders);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = isProd
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:5174',
    ].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      if (isProd) return callback(new Error('CORS: direct requests not allowed in production'));
      return callback(null, true);
    }
    if (/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin) && !isProd) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn('CORS: blocked origin', { origin });
    callback(new Error('CORS: origin not allowed'));
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge:         600,
}));

// ── Request logging ───────────────────────────────────────────────────────────
app.use(morgan(isProd ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip:   (req) => req.path === '/api/health' && req.method === 'GET',
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(sanitizeAll);
app.use(globalLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
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
app.use('/api/community',  communityRoutes);
app.use('/api/classify',   classifyRoutes);
app.use('/api/admin',      adminRoutes);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`ScanAndSee API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

export default app;
