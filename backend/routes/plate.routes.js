import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { compareLimiter } from '../middleware/rateLimiter.js';
import { handleUpload, uploadTwo } from '../middleware/upload.js';
import { processImage, imageToGeminiPart } from '../services/image.service.js';
import { getGeminiModel } from '../config/gemini.js';
import { buildPlatePrompt } from '../prompts/plate.prompt.js';
import { getProfile } from '../services/firebase.service.js';
import { extractJson } from '../utils/helpers.js';
import { badRequest, badGateway } from '../utils/apiError.js';
import { sanitizeAiOutput } from '../utils/sanitizeOutput.js';
import { USER_GOALS } from '../config/constants.js';

const router = Router();
router.use(authenticate);

// ── POST /api/plate/build ─────────────────────────────────────────────────────
// Accepts 1-2 food images and builds an optimal meal combination
router.post('/build', compareLimiter, handleUpload(uploadTwo), async (req, res, next) => {
  try {
    const imageA = req.files?.imageA?.[0];
    if (!imageA) throw badRequest('At least one food image required (field: imageA).');

    const profile = await getProfile(req.user.uid);
    const goal    = profile?.goal || 'healthy_eating';
    const model   = getGeminiModel();
    const prompt  = buildPlatePrompt(goal);

    const bufferA   = await processImage(imageA.buffer);
    const imagePartA = imageToGeminiPart(bufferA);
    const parts     = [{ text: prompt }, imagePartA];

    // Optional second food
    const imageB = req.files?.imageB?.[0];
    if (imageB) {
      const bufferB = await processImage(imageB.buffer);
      parts.push(imageToGeminiPart(bufferB));
    }

    const result = await model.generateContent({
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(result.response.text());
    if (!parsed) throw badGateway('Plate building failed. Please try again.');
    res.json(sanitizeAiOutput(parsed));
  } catch (err) {
    next(err);
  }
});

export default router;
