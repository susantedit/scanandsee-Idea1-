import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { getGeminiModel } from '../config/gemini.js';
import { buildBudgetPrompt } from '../prompts/budget.prompt.js';
import { getProfile } from '../services/firebase.service.js';
import { extractJson } from '../utils/helpers.js';
import { badGateway } from '../utils/apiError.js';
import { sanitizeAiOutput } from '../utils/sanitizeOutput.js';
import { USER_GOALS } from '../config/constants.js';

const router = Router();
router.use(authenticate);

const BudgetRequestSchema = z.object({
  budget:   z.number().positive().max(10000),
  currency: z.string().max(10).trim().default('USD'),
  goal:     z.enum(USER_GOALS).default('healthy_eating'),
  days:     z.number().int().min(1).max(7).default(1),
});

// ── POST /api/budget/optimize ─────────────────────────────────────────────────
router.post('/optimize', chatLimiter, validate(BudgetRequestSchema), async (req, res, next) => {
  try {
    const model  = getGeminiModel();
    const prompt = buildBudgetPrompt(req.body);

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(result.response.text());
    if (!parsed) throw badGateway('Budget optimization failed. Please try again.');
    res.json(sanitizeAiOutput(parsed));
  } catch (err) {
    next(err);
  }
});

export default router;
