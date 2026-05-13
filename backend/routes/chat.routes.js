import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { ChatRequestSchema } from '../schemas/chat.schema.js';
import { chatAboutFood } from '../services/gemini.service.js';
import { getScan, getProfile } from '../services/firebase.service.js';
import { forbidden } from '../utils/apiError.js';

const router = Router();
router.use(authenticate);

// ── POST /api/chat/ask ────────────────────────────────────────────────────────
router.post(
  '/ask',
  chatLimiter,
  validate(ChatRequestSchema),
  async (req, res, next) => {
    try {
      const { question, scanId } = req.body;

      // Get user's AI persona — from their own profile, never from request body
      const profile = await getProfile(req.user.uid);
      const persona = profile?.aiPersona || 'coach';

      // IDOR protection: if scanId provided, verify the scan belongs to this user
      let scanContext = null;
      if (scanId) {
        const scan = await getScan(req.user.uid, scanId);
        // If scan not found under this user's UID, silently ignore context
        // (don't reveal whether the scan exists for another user)
        if (scan) {
          scanContext = {
            foodName:    scan.foodName,
            healthScore: scan.healthScore,
            verdict:     scan.verdict,
            calories:    scan.calories,
            protein_g:   scan.protein,
            carbs_g:     scan.carbs,
            fats_g:      scan.fats,
            sugar_g:     scan.sugar,
            sodium_mg:   scan.sodium,
            warnings:    scan.warnings,
          };
        }
      }

      const response = await chatAboutFood(question, scanContext, persona);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
