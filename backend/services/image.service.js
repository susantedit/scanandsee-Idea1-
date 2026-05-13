import sharp from 'sharp';
import { IMAGE_MAX_WIDTH, IMAGE_JPEG_QUALITY } from '../config/constants.js';
import { bufferToBase64 } from '../utils/helpers.js';
import logger from '../utils/logger.js';

/**
 * Compress and resize an image buffer.
 * - Resizes to max IMAGE_MAX_WIDTH px wide (maintains aspect ratio)
 * - Converts to JPEG at IMAGE_JPEG_QUALITY%
 * - Strips EXIF metadata
 *
 * @param {Buffer} buffer - raw image buffer from multer
 * @returns {Promise<Buffer>} processed JPEG buffer
 */
export async function processImage(buffer) {
  return sharp(buffer)
    .resize(IMAGE_MAX_WIDTH, null, { withoutEnlargement: true })
    .jpeg({ quality: IMAGE_JPEG_QUALITY })
    .withMetadata(false) // strip EXIF
    .toBuffer();
}

/**
 * Convert a processed image buffer to base64 for Gemini API.
 * @param {Buffer} buffer
 * @returns {{ inlineData: { mimeType: string, data: string } }}
 */
export function imageToGeminiPart(buffer) {
  return {
    inlineData: {
      mimeType: 'image/jpeg',
      data: bufferToBase64(buffer),
    },
  };
}

/**
 * Convert image buffer to a base64 data URL for storing in Firestore.
 * No Firebase Storage needed — free, no extra cost.
 *
 * We store a thumbnail (small) version to keep Firestore document size low.
 * Firestore document limit is 1MB — thumbnail at 200px wide is ~10-20KB.
 *
 * @param {Buffer} buffer - already processed JPEG buffer
 * @returns {Promise<string>} base64 data URL like "data:image/jpeg;base64,..."
 */
export async function imageToDataUrl(buffer) {
  try {
    // Create a small thumbnail for storage (200px wide, 60% quality)
    const thumbnail = await sharp(buffer)
      .resize(200, null, { withoutEnlargement: true })
      .jpeg({ quality: 60 })
      .toBuffer();

    const base64 = bufferToBase64(thumbnail);
    logger.debug(`Thumbnail created: ${Math.round(thumbnail.length / 1024)}KB`);
    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    logger.warn('Thumbnail creation failed — storing without image', { error: err.message });
    return null;
  }
}
