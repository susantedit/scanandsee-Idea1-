import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { scanLimiter } from '../middleware/rateLimiter.js';
import { handleUpload, uploadSingle } from '../middleware/upload.js';
import { validateQuery, validateParams } from '../middleware/validate.js';
import { HistoryQuerySchema } from '../schemas/scan.schema.js';
import { processImage } from '../services/image.service.js';
import { analyzeFood } from '../services/gemini.service.js';
import { enrichAnalysis } from '../services/nutrition.service.js';
import { calculateHealthScore, scoreToVerdict } from '../services/score.service.js';
import { saveScan, getScan, getScanHistory, deleteScan } from '../services/firebase.service.js';
import { notFound, badRequest, forbidden } from '../utils/apiError.js';
import logger from '../utils/logger.js';

const router = Router();

// All scan routes require authentication
router.use(authenticate);

// Validate scanId param — must be a 32-char hex string (our generateId() format)
const ScanIdSchema = z.object({
  scanId: z.string().regex(/^[a-f0-9]{32}$/, 'Invalid scan ID format'),
});

// Validate personality — only allow known values, never pass raw user input to AI
const ALLOWED_PERSONALITIES = new Set(['doctor', 'gym_bro', 'coach', 'savage_roast']);
const ALLOWED_GOALS = new Set([
  'weight_loss', 'muscle_gain', 'bulking', 'cutting',
  'healthy_eating', 'diabetic', 'student_budget',
]);

// ── POST /api/scan/analyze ────────────────────────────────────────────────────
router.post(
  '/analyze',
  scanLimiter,
  handleUpload(uploadSingle),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw badRequest('No image file provided. Send image as multipart/form-data field "image".');
      }

      // Whitelist-validate all form fields — never pass raw strings to AI prompts
      const gymMode = req.body.gymMode === 'true' || req.body.gymMode === true;

      // Validate personality against allowlist — prevents prompt injection via this field
      const rawPersonality = req.body.personality || 'coach';
      const personality = ALLOWED_PERSONALITIES.has(rawPersonality) ? rawPersonality : 'coach';

      // Validate goal against allowlist
      const rawGoal = req.body.userGoal || '';
      const userGoal = ALLOWED_GOALS.has(rawGoal) ? rawGoal : '';

      logger.info('Scan started', { uid: req.user.uid, gymMode, personality });

      // 1. Process image — resize, compress, strip EXIF, verify magic bytes
      const processedBuffer = await processImage(req.file.buffer);

      // 2. Analyze with Gemini Vision
      const analysis = await analyzeFood(processedBuffer, { gymMode, userGoal, personality });

      // 3. Recalculate health score server-side — never trust AI's self-scoring
      analysis.health_score = calculateHealthScore(analysis);
      analysis.verdict      = scoreToVerdict(analysis.health_score);

      // 4. Enrich with USDA data
      const enriched = await enrichAnalysis(analysis);

      // 5. Save to Firestore — image stored as base64 thumbnail
      const savedScanId = await saveScan(req.user.uid, enriched, processedBuffer);

      logger.info('Scan complete', {
        uid:   req.user.uid,
        food:  enriched.food_name,
        score: enriched.health_score,
        id:    savedScanId,
      });

      res.status(201).json({
        scanId: savedScanId,
        ...enriched,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/scan/history ─────────────────────────────────────────────────────
router.get(
  '/history',
  validateQuery(HistoryQuerySchema),
  async (req, res, next) => {
    try {
      const { limit, offset } = req.query;
      // Ownership enforced: getScanHistory scopes to req.user.uid
      const history = await getScanHistory(req.user.uid, limit, offset);
      res.json({ scans: history, count: history.length });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/scan/:scanId ─────────────────────────────────────────────────────
router.get(
  '/:scanId',
  validateParams(ScanIdSchema),
  async (req, res, next) => {
    try {
      // IDOR protection: getScan scopes query to req.user.uid — a user can never
      // read another user's scan even if they guess the scanId
      const scan = await getScan(req.user.uid, req.params.scanId);
      if (!scan) throw notFound('Scan not found');
      res.json(scan);
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/scan/:scanId ──────────────────────────────────────────────────
router.delete(
  '/:scanId',
  validateParams(ScanIdSchema),
  async (req, res, next) => {
    try {
      // IDOR protection: verify ownership before delete
      const scan = await getScan(req.user.uid, req.params.scanId);
      if (!scan) throw notFound('Scan not found');

      // Extra ownership assertion (belt-and-suspenders)
      // getScan already scopes to uid, but explicit check makes intent clear
      await deleteScan(req.user.uid, req.params.scanId);

      logger.info('Scan deleted', { uid: req.user.uid, scanId: req.params.scanId });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
