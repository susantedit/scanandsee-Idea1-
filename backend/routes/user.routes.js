import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { ProfileSchema } from '../schemas/user.schema.js';
import { getProfile, saveProfile, getUserStats } from '../services/firebase.service.js';
import { cacheService } from '../services/cache.service.js';
import { CACHE_TTL_PROFILE } from '../config/constants.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ── POST /api/user/profile ────────────────────────────────────────────────────
router.post(
  '/profile',
  authLimiter,          // rate-limit profile creation/updates
  validate(ProfileSchema),
  async (req, res, next) => {
    try {
      // Always save to the authenticated user's own UID — never from body
      await saveProfile(req.user.uid, req.body);
      cacheService.del(`user:${req.user.uid}`);
      const profile = await getProfile(req.user.uid);
      res.json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/user/profile ─────────────────────────────────────────────────────
router.get('/profile', async (req, res, next) => {
  try {
    const cacheKey = `user:${req.user.uid}`;
    const profile = await cacheService.getOrSet(
      cacheKey,
      () => getProfile(req.user.uid),
      CACHE_TTL_PROFILE
    );
    res.json({ profile: profile || null });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/user/stats ───────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getUserStats(req.user.uid);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
