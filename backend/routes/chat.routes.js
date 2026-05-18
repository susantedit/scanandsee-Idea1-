import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { ChatRequestSchema } from '../schemas/chat.schema.js';
import { chatAboutFood } from '../services/gemini.service.js';
import { getScan, getProfile } from '../services/firebase.service.js';
import { getFirestore } from '../config/firebase.js';

const router = Router();
router.use(authenticate);

router.post('/ask', chatLimiter, validate(ChatRequestSchema), async (req, res, next) => {
  try {
    const { question, scanId } = req.body;

    const profile = await getProfile(req.user.uid);
    const persona = profile?.aiPersona || 'coach';

    let scanContext = null;
    if (scanId) {
      const scan = await getScan(req.user.uid, scanId);
      if (scan) {
        scanContext = {
          foodName: scan.foodName, healthScore: scan.healthScore,
          verdict: scan.verdict, calories: scan.calories,
          protein_g: scan.protein, carbs_g: scan.carbs,
          fats_g: scan.fats, sugar_g: scan.sugar,
          sodium_mg: scan.sodium, warnings: scan.warnings,
        };
      }
    }

    // AI Memory — fetch recent scans for personalization
    let scanHistory = [];
    try {
      const db = getFirestore();
      const snap = await db.collection('users').doc(req.user.uid)
        .collection('scans').orderBy('createdAt', 'desc').limit(5).get();
      scanHistory = snap.docs.map(d => `${d.data().foodName} (${d.data().healthScore}/10)`);
    } catch { /* non-fatal */ }

    const response = await chatAboutFood(question, scanContext, persona, scanHistory);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
