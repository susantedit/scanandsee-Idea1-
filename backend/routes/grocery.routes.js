import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { compareLimiter } from '../middleware/rateLimiter.js';
import { processImage, imageToGeminiPart } from '../services/image.service.js';
import { getGeminiModel } from '../config/gemini.js';
import { buildAnalysisPrompt } from '../prompts/analyze.prompt.js';
import { buildGroceryPrompt } from '../prompts/grocery.prompt.js';
import { getProfile } from '../services/firebase.service.js';
import { extractJson, withRetry } from '../utils/helpers.js';
import { badRequest, badGateway } from '../utils/apiError.js';
import { ALLOWED_MIME_TYPES, IMAGE_MAX_SIZE_B } from '../config/constants.js';
import { sanitizeAiOutput } from '../utils/sanitizeOutput.js';

const router = Router();
router.use(authenticate);

// ── Multer for cart (up to 5 images) ─────────────────────────────────────────
const uploadCart = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize:  IMAGE_MAX_SIZE_B,
    files:     5,
    fields:    3,
    fieldSize: 512,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(badRequest(`Invalid file type: ${file.mimetype}`));
    }
  },
}).array('images', 5);

/**
 * Magic byte check — same as upload.js but inline for the cart multer instance.
 */
function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true; // JPEG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true; // PNG
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true; // WebP
  if (buffer.length >= 12 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return true; // HEIC
  return false;
}

// ── POST /api/grocery/analyze ─────────────────────────────────────────────────
router.post('/analyze', compareLimiter, (req, res, next) => {
  uploadCart(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE')  return next(badRequest('File too large'));
      if (err.code === 'LIMIT_FILE_COUNT') return next(badRequest('Maximum 5 images'));
      return next(badRequest(err.message || 'Upload error'));
    }

    try {
      const files = req.files;
      if (!files?.length) throw badRequest('Send 1-5 food images as "images" field.');

      // Magic byte validation on all uploaded files
      for (const file of files) {
        if (!isValidImageBuffer(file.buffer)) {
          throw badRequest('One or more files are not valid images');
        }
      }

      const profile = await getProfile(req.user.uid);
      const goal    = profile?.goal || 'healthy_eating';
      const model   = getGeminiModel();

      // Step 1: Analyze each item individually
      const analyses = await Promise.all(files.map(async (file) => {
        const buffer    = await processImage(file.buffer);
        const imagePart = imageToGeminiPart(buffer);
        const prompt    = buildAnalysisPrompt({ gymMode: false, userGoal: goal });

        const result = await withRetry(() => model.generateContent({
          contents: [{ parts: [{ text: prompt }, imagePart] }],
          generationConfig: { responseMimeType: 'application/json' },
        }), 2, 500);

        const parsed = extractJson(result.response.text());
        // Return safe defaults if parsing fails — never crash the whole cart
        return parsed || {
          food_name: 'Unknown Item', health_score: 5,
          calories: 0, protein_g: 0, sugar_g: 0,
          verdict: 'MODERATE', warnings: [],
        };
      }));

      // Step 2: Cart-level analysis
      const cartPrompt  = buildGroceryPrompt(analyses, goal);
      const cartResult  = await model.generateContent({
        contents: [{ parts: [{ text: cartPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      });

      const cartAnalysis = extractJson(cartResult.response.text());
      if (!cartAnalysis) throw badGateway('Cart analysis failed. Please try again.');

      res.json({ items: analyses.map(a => sanitizeAiOutput(a)), cart: sanitizeAiOutput(cartAnalysis) });
    } catch (err) {
      next(err);
    }
  });
});

export default router;
