import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { getGeminiModel } from '../config/gemini.js';
import { buildMoodPrompt } from '../prompts/mood.prompt.js';
import { getProfile } from '../services/firebase.service.js';
import { extractJson } from '../utils/helpers.js';
import { badGateway, badRequest } from '../utils/apiError.js';
import { sanitizeAiOutput } from '../utils/sanitizeOutput.js';

const router = Router();
router.use(authenticate);

const MoodRequestSchema = z.object({
  food_name:  z.string().min(1).max(200).trim(),
  calories:   z.number().nonnegative(),
  protein_g:  z.number().nonnegative(),
  carbs_g:    z.number().nonnegative(),
  fats_g:     z.number().nonnegative(),
  sugar_g:    z.number().nonnegative(),
  sodium_mg:  z.number().nonnegative(),
});

// ── POST /api/mood/analyze ────────────────────────────────────────────────────
router.post('/analyze', chatLimiter, validate(MoodRequestSchema), async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.uid);
    const persona = profile?.aiPersona || 'coach';
    const model   = getGeminiModel();
    const prompt  = buildMoodPrompt(req.body, persona);

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(result.response.text());
    if (!parsed) throw badGateway('Mood analysis failed. Please try again.');
    res.json(sanitizeAiOutput(parsed));
  } catch (err) {
    next(err);
  }
});

export default router;
