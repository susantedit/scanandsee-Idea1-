import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validate.js';
import { searchUSDA } from '../services/nutrition.service.js';
import { getDailyLog, getWeeklyLogs } from '../services/firebase.service.js';
import { badRequest } from '../utils/apiError.js';

const router = Router();
router.use(authenticate);

const SearchQuerySchema = z.object({
  query: z.string().min(1).max(200),
});

// ── GET /api/nutrition/search?query= ─────────────────────────────────────────
router.get('/search', validateQuery(SearchQuerySchema), async (req, res, next) => {
  try {
    const results = await searchUSDA(req.query.query);
    res.json({ results, count: results.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/nutrition/daily ──────────────────────────────────────────────────
router.get('/daily', async (req, res, next) => {
  try {
    const log = await getDailyLog(req.user.uid);
    res.json(log);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/nutrition/weekly ─────────────────────────────────────────────────
router.get('/weekly', async (req, res, next) => {
  try {
    const logs = await getWeeklyLogs(req.user.uid);
    res.json({ days: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
