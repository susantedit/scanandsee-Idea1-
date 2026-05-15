/**
 * Lightweight classifier endpoint — POST /api/classify/quick
 *
 * Uses a minimal Gemini prompt (text-only, no vision model overhead)
 * to return a fast food category + rough macro estimate.
 * Costs ~10x fewer tokens than a full scan/analyze call.
 * Used for live-frame previews in the camera overlay.
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { globalLimiter } from '../middleware/rateLimiter.js';
import { handleUpload, uploadSingle } from '../middleware/upload.js';
import { processImage, imageToGeminiPart } from '../services/image.service.js';
import { getGeminiModel } from '../config/gemini.js';
import { extractJson } from '../utils/helpers.js';
import { badRequest, badGateway } from '../utils/apiError.js';
import { sanitizeAiOutput } from '../utils/sanitizeOutput.js';

const router = Router();
router.use(authenticate);

// Tighter rate limit for live frames — 60/hour (12x the full scan limit)
import rateLimit from 'express-rate-limit';
const classifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.uid || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Live preview limit reached.',
      retryInSeconds: 60,
    });
  },
  skip: (req) => req.user?.tier === 'premium',
});

const CLASSIFY_PROMPT = `You are a fast food classifier. Analyze this image and return ONLY valid JSON:
{
  "food_name": "string (max 30 chars)",
  "category": "protein" | "carbs" | "fats" | "mixed" | "drink" | "snack" | "unknown",
  "health_score": number (0-10, one decimal),
  "verdict": "HEALTHY" | "MODERATE" | "UNHEALTHY",
  "calories_est": number (rough estimate, integer),
  "protein_est": number (grams, integer),
  "sugar_est": number (grams, integer),
  "flags": ["string"] (max 3 short flags like "High Sugar", "Good Protein", "Trans Fat")
}
Be fast and approximate. Do not explain. Return JSON only.`;

// ── POST /api/classify/quick ──────────────────────────────────────────────────
router.post(
  '/quick',
  classifyLimiter,
  handleUpload(uploadSingle),
  async (req, res, next) => {
    try {
      if (!req.file) throw badRequest('No image provided.');

      const buffer    = await processImage(req.file.buffer);
      const imagePart = imageToGeminiPart(buffer);
      const model     = getGeminiModel();

      const result = await model.generateContent({
        contents: [{ parts: [{ text: CLASSIFY_PROMPT }, imagePart] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 200,   // hard cap — keeps it cheap and fast
          temperature: 0.1,       // low temp = consistent, fast output
        },
      });

      const parsed = extractJson(result.response.text());
      if (!parsed) throw badGateway('Classifier returned invalid response.');

      res.json(sanitizeAiOutput(parsed));
    } catch (err) {
      // On 429 from Gemini, pass retry info to client
      if (err.status === 429 || err.message?.includes('429')) {
        return res.status(429).json({
          error: 'AI quota reached. Slow down live preview.',
          retryInSeconds: 30,
        });
      }
      next(err);
    }
  }
);

export default router;
