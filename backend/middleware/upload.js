import multer from 'multer';
import { ALLOWED_MIME_TYPES, IMAGE_MAX_SIZE_B } from '../config/constants.js';
import { badRequest } from '../utils/apiError.js';

// Store files in memory as Buffer — processed with sharp before any use
const storage = multer.memoryStorage();

/**
 * Validate file MIME type against allowlist.
 * Defense-in-depth: multer checks the Content-Type header,
 * but we also validate the declared MIME type here.
 * The actual magic-byte check happens in handleUpload() below.
 */
function mimeTypeFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(badRequest(
      `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, HEIC`
    ));
  }
}

// Shared multer limits
const sharedLimits = {
  fileSize:  IMAGE_MAX_SIZE_B,
  fields:    5,       // max non-file fields
  fieldSize: 1024,    // max field value size (1KB)
};

// ── Single image upload ───────────────────────────────────────────────────────
export const uploadSingle = multer({
  storage,
  limits: { ...sharedLimits, files: 1 },
  fileFilter: mimeTypeFilter,
}).single('image');

// ── Two images upload (for comparison) ───────────────────────────────────────
export const uploadTwo = multer({
  storage,
  limits: { ...sharedLimits, files: 2 },
  fileFilter: mimeTypeFilter,
}).fields([
  { name: 'imageA', maxCount: 1 },
  { name: 'imageB', maxCount: 1 },
]);

// ── Multer error handler wrapper ──────────────────────────────────────────────
/**
 * Wraps a multer middleware and converts multer errors to ApiErrors.
 * Also validates magic bytes to catch renamed executables.
 */
export function handleUpload(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        // multer v2 uses err.type instead of err.code for some errors
        const code = err.code || err.type;
        if (code === 'LIMIT_FILE_SIZE') {
          return next(badRequest(
            `File too large. Maximum size is ${IMAGE_MAX_SIZE_B / 1024 / 1024}MB`
          ));
        }
        if (code === 'LIMIT_FILE_COUNT' || code === 'LIMIT_UNEXPECTED_FILE') {
          return next(badRequest('Unexpected file upload'));
        }
        if (code === 'LIMIT_FIELD_VALUE') {
          return next(badRequest('Form field value too large'));
        }
        if (err.name === 'MulterError') {
          return next(badRequest(`Upload error: ${err.message}`));
        }
        return next(err);
      }

      // Magic byte validation — verify buffer actually starts with a known image header
      // Catches files renamed to .jpg that are actually executables
      const files = req.file
        ? [req.file]
        : Object.values(req.files || {}).flat();

      for (const file of files) {
        if (!file?.buffer || !isValidImageBuffer(file.buffer)) {
          return next(badRequest('Uploaded file does not appear to be a valid image'));
        }
      }

      next();
    });
  };
}

/**
 * Check magic bytes to verify the buffer is a real image.
 */
function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;

  // WebP: 52 49 46 46 (RIFF header)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true;

  // HEIC/HEIF: ftyp box at bytes 4-7
  if (buffer.length >= 12 &&
      buffer[4] === 0x66 && buffer[5] === 0x74 &&
      buffer[6] === 0x79 && buffer[7] === 0x70) return true;

  return false;
}
