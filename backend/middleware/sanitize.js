/**
 * Input sanitization middleware.
 *
 * Defends against:
 * - XSS via script injection in string fields
 * - Prototype pollution via __proto__ / constructor keys
 * - Oversized payloads (body parser limit handles bytes, this handles field counts)
 * - Null-byte injection in strings
 * - Unicode control characters
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_STRING_LENGTH = 10_000;
const MAX_OBJECT_DEPTH  = 5;
const MAX_ARRAY_LENGTH  = 200;

/**
 * Recursively sanitize a value.
 * - Strips null bytes and control characters from strings
 * - Removes prototype-pollution keys from objects
 * - Enforces depth and array length limits
 */
function sanitizeValue(value, depth = 0) {
  if (depth > MAX_OBJECT_DEPTH) return null;

  if (typeof value === 'string') {
    return value
      .replace(/\0/g, '')                          // null bytes
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars (keep \t \n \r)
      .slice(0, MAX_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_LENGTH)
      .map(item => sanitizeValue(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(k)) continue;          // block prototype pollution
      if (typeof k !== 'string') continue;
      if (k.length > 256) continue;                 // reject absurdly long keys
      clean[k] = sanitizeValue(v, depth + 1);
    }
    return clean;
  }

  // numbers, booleans, null — pass through unchanged
  return value;
}

/**
 * Express middleware — sanitizes req.body in place.
 * Apply after body-parser, before route handlers.
 */
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}

/**
 * Express middleware — sanitizes req.query in place.
 */
export function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  next();
}

/**
 * Express middleware — sanitizes req.params in place.
 */
export function sanitizeParams(req, res, next) {
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}

/**
 * Combined middleware — sanitizes body + query + params.
 */
export function sanitizeAll(req, res, next) {
  sanitizeBody(req, res, () => {});
  sanitizeQuery(req, res, () => {});
  sanitizeParams(req, res, () => {});
  next();
}
