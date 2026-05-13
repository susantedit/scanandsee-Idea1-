import { randomBytes } from 'crypto';

/**
 * Generate a unique ID (hex string).
 * @param {number} bytes - byte length (default 16 → 32 char hex)
 */
export function generateId(bytes = 16) {
  return randomBytes(bytes).toString('hex');
}

/**
 * Get today's date as YYYY-MM-DD string (UTC).
 */
export function todayKey() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Sleep for ms milliseconds (for retry backoff).
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff.
 * @param {Function} fn        - async function to retry
 * @param {number}   attempts  - max attempts (default 3)
 * @param {number}   baseMs    - base delay in ms (default 1000)
 */
export async function withRetry(fn, attempts = 3, baseMs = 1000) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await sleep(baseMs * Math.pow(2, i)); // 1s, 2s, 4s
      }
    }
  }
  throw lastError;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to N decimal places.
 */
export function round(value, decimals = 1) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Convert image buffer to base64 string.
 */
export function bufferToBase64(buffer) {
  return buffer.toString('base64');
}

/**
 * Safely parse JSON — returns null on failure instead of throwing.
 */
export function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Extract JSON from a string that may have markdown code fences.
 * Gemini sometimes wraps JSON in ```json ... ```
 */
export function extractJson(text) {
  // Try direct parse first
  const direct = safeJsonParse(text);
  if (direct) return direct;

  // Strip markdown code fences
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return safeJsonParse(match[1].trim());

  // Try finding first { ... } block
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    return safeJsonParse(text.slice(start, end + 1));
  }

  return null;
}
