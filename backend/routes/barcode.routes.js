import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { globalLimiter } from '../middleware/rateLimiter.js';
import { lookupBarcode } from '../services/nutrition.service.js';
import { notFound, badRequest } from '../utils/apiError.js';

const router = Router();
router.use(authenticate);

// Strict barcode regex — digits only, 6–14 chars (EAN-8, EAN-13, UPC-A, UPC-E)
const BARCODE_RE = /^\d{6,14}$/;

// ── GET /api/barcode/:code ────────────────────────────────────────────────────
router.get('/:code', globalLimiter, async (req, res, next) => {
  try {
    const { code } = req.params;

    // Validate before using in any downstream call
    if (!BARCODE_RE.test(code)) {
      throw badRequest('Invalid barcode. Must be 6–14 digits only.');
    }

    const product = await lookupBarcode(code);
    if (!product) {
      throw notFound('Product not found in database.');
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
