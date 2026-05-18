import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { ProfileSchema } from '../schemas/user.schema.js';
import { getProfile, saveProfile, getUserStats, getScanHistory } from '../services/firebase.service.js';
import { cacheService } from '../services/cache.service.js';
import { groqJson } from '../services/groq.service.js';
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

// ── GET /api/user/insights ────────────────────────────────────────────────────
router.get('/insights', async (req, res, next) => {
  try {
    const cacheKey = `user_insights:${req.user.uid}`;
    
    // Cache insights for 1 hour to avoid unnecessary AI calls
    const insights = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const history = await getScanHistory(req.user.uid, 30, 0); // last 30 scans
        if (!history || history.length < 5) {
          return [{ title: 'Keep scanning', description: 'We need a few more scans to generate personalized behavioral insights.' }];
        }

        const simplifiedHistory = history.map(h => ({
          food: h.foodName,
          healthScore: h.healthScore,
          verdict: h.verdict,
          date: h.createdAt,
        }));

        const prompt = `You are a world-class behavioral nutrition analyst.
Analyze the following recent food scan history for a user and extract 2 to 3 actionable, specific behavioral insights.
Look for patterns in time of day (if evident), food choices, recurring verdicts, or health score trends.
Make the insights sound encouraging but highly insightful, like a proactive AI coach.

History:
${JSON.stringify(simplifiedHistory, null, 2)}

Respond ONLY with a JSON object in this format:
{
  "insights": [
    { "title": "string (short, catchy)", "description": "string (1-2 sentences explaining the pattern and a tip)" }
  ]
}`;

        const parsed = await groqJson(prompt, { maxTokens: 500, temperature: 0.3 });
        return parsed.insights || [];
      },
      3600 // 1 hour cache
    );

    res.json({ insights });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/user/warnings ────────────────────────────────────────────────────
router.get('/warnings', async (req, res, next) => {
  try {
    const history = await getScanHistory(req.user.uid, 15, 0); // last 15 scans
    if (!history || history.length < 3) return res.json({ warnings: [] });

    // Simple rule-based warnings
    const warnings = [];
    const recentSugar = history.slice(0, 5).reduce((sum, s) => sum + (s.sugar || 0), 0);
    const recentScoreAvg = history.slice(0, 5).reduce((sum, s) => sum + (s.healthScore || 0), 0) / 5;

    if (recentSugar > 50) {
      warnings.push("You've been scanning high-sugar items recently. Watch out for energy crashes!");
    }
    if (recentScoreAvg < 4) {
      warnings.push("Your recent food choices have a low health score. Try scanning some fresh produce!");
    }

    res.json({ warnings });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/user/push-token ─────────────────────────────────────────────────
router.post('/push-token', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    // Save token to user profile
    await saveProfile(req.user.uid, { pushToken: token });
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
