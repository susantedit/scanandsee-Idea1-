import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { voiceLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { generateVoice, getPersonalities } from '../services/voice.service.js';
import { cacheService } from '../services/cache.service.js';
import { CACHE_TTL_VOICES } from '../config/constants.js';

const router = Router();

const VoiceRequestSchema = z.object({
  text:        z.string().min(1).max(500).trim(), // tighter limit — voice explanations are short
  personality: z.enum(['doctor', 'gym_bro', 'coach', 'savage_roast']).default('coach'),
  // Client can request premium but server verifies tier from token — client cannot self-upgrade
  premium:     z.boolean().default(false),
});

// ── POST /api/voice/generate ──────────────────────────────────────────────────
router.post(
  '/generate',
  authenticate,
  voiceLimiter,
  validate(VoiceRequestSchema),
  async (req, res, next) => {
    try {
      const { text, personality } = req.body;
      // Tier comes from verified token claim — never from request body
      const isPremium = req.user?.tier === 'premium';
      const result = await generateVoice(text, personality, isPremium);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/voice/personalities ─────────────────────────────────────────────
// Public — no auth needed, cached
router.get('/personalities', async (req, res, next) => {
  try {
    const personalities = await cacheService.getOrSet(
      'voices:list',
      () => getPersonalities(),
      CACHE_TTL_VOICES
    );
    res.json({ personalities });
  } catch (err) {
    next(err);
  }
});

export default router;
