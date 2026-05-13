import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { getGeminiModel } from '../config/gemini.js';
import { buildRiskPrompt } from '../prompts/risk.prompt.js';
import { getWeeklyLogs } from '../services/firebase.service.js';
import { extractJson } from '../utils/helpers.js';
import { badGateway } from '../utils/apiError.js';
import { sanitizeAiOutput } from '../utils/sanitizeOutput.js';

const router = Router();
router.use(authenticate);

// ── GET /api/risk/predict ─────────────────────────────────────────────────────
router.get('/predict', chatLimiter, async (req, res, next) => {
  try {
    const weeklyLogs = await getWeeklyLogs(req.user.uid);
    const model      = getGeminiModel();
    const prompt     = buildRiskPrompt(weeklyLogs);

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(result.response.text());
    if (!parsed) throw badGateway('Risk prediction failed. Please try again.');
    res.json(sanitizeAiOutput(parsed));
  } catch (err) {
    next(err);
  }
});

export default router;
