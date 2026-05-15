import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { groqJson } from '../services/groq.service.js';
import { buildRiskPrompt } from '../prompts/risk.prompt.js';
import { getWeeklyLogs } from '../services/firebase.service.js';
import { sanitizeAiOutput } from '../utils/sanitizeOutput.js';

const router = Router();
router.use(authenticate);

// ── GET /api/risk/predict ─────────────────────────────────────────────────────
router.get('/predict', chatLimiter, async (req, res, next) => {
  try {
    const weeklyLogs = await getWeeklyLogs(req.user.uid);
    const prompt     = buildRiskPrompt(weeklyLogs);
    const parsed     = await groqJson(prompt, { maxTokens: 1000, temperature: 0.2 });
    res.json(sanitizeAiOutput(parsed));
  } catch (err) { next(err); }
});

export default router;
