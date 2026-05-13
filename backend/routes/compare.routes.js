import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { compareLimiter } from '../middleware/rateLimiter.js';
import { handleUpload, uploadTwo } from '../middleware/upload.js';
import { processImage } from '../services/image.service.js';
import { compareProducts } from '../services/gemini.service.js';
import { badRequest } from '../utils/apiError.js';

const router = Router();
router.use(authenticate);

// ── POST /api/compare/products ────────────────────────────────────────────────
router.post(
  '/products',
  compareLimiter,
  handleUpload(uploadTwo),
  async (req, res, next) => {
    try {
      const imageA = req.files?.imageA?.[0];
      const imageB = req.files?.imageB?.[0];

      if (!imageA) throw badRequest('Missing imageA — send as multipart field "imageA"');
      if (!imageB) throw badRequest('Missing imageB — send as multipart field "imageB"');

      const [bufferA, bufferB] = await Promise.all([
        processImage(imageA.buffer),
        processImage(imageB.buffer),
      ]);

      const result = await compareProducts(bufferA, bufferB);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
