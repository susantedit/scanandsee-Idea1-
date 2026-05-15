import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { groqJson } from '../services/groq.service.js';
import { buildMoodPrompt } from '../prompts/mood.prompt.js';
import { getProfile } from '../services/firebase.service.js';
import { sanitizeAiOutput } from '../utils/sanitizeOutput.js';

const router = Router();
router.use(authenticate);

const MoodRequestSchema = z.object({
  food_name: z.string().min(1).max(200).trim(),
  calories:  z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
  carbs_g:   z.number().nonnegative(),
  fats_g:    z.number().nonnegative(),
  sugar_g:   z.number().nonnegative(),
  sodium_mg: z.number().nonnegative(),
});

// ── POST /api/mood/analyze ────────────────────────────────────────────────────
router.post('/analyze', chatLimiter, validate(MoodRequestSchema), async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.uid);
    const persona = profile?.aiPersona || 'coach';
    const prompt  = buildMoodPrompt(req.body, persona);
    const parsed  = await groqJson(prompt, { maxTokens: 600, temperature: 0.3 });
    res.json(sanitizeAiOutput(parsed));
  } catch (err) { next(err); }
});

export default router;
