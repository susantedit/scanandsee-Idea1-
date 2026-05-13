import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { scanLimiter } from '../middleware/rateLimiter.js';
import { handleUpload, uploadSingle } from '../middleware/upload.js';
import { processImage, imageToGeminiPart } from '../services/image.service.js';
import { getGeminiModel } from '../config/gemini.js';
import { buildSupplementPrompt } from '../prompts/supplement.prompt.js';
import { getProfile } from '../services/firebase.service.js';
import { extractJson } from '../utils/helpers.js';
import { badRequest, badGateway } from '../utils/apiError.js';
import { sanitizeAiOutput } from '../utils/sanitizeOutput.js';

const router = Router();
router.use(authenticate);

// ── POST /api/supplement/analyze ──────────────────────────────────────────────
router.post('/analyze', scanLimiter, handleUpload(uploadSingle), async (req, res, next) => {
  try {
    if (!req.file) throw badRequest('No image provided.');

    const profile   = await getProfile(req.user.uid);
    const persona   = profile?.aiPersona || 'coach';
    const model     = getGeminiModel();
    const buffer    = await processImage(req.file.buffer);
    const imagePart = imageToGeminiPart(buffer);
    const prompt    = buildSupplementPrompt(persona);

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }, imagePart] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(result.response.text());
    if (!parsed) throw badGateway('Supplement analysis failed. Please try again.');
    res.json(sanitizeAiOutput(parsed));
  } catch (err) {
    next(err);
  }
});

export default router;
