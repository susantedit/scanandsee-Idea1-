/**
 * Sanitize AI output before sending to client.
 *
 * Gemini responses are generally safe JSON, but we sanitize as defense-in-depth
 * against prompt injection attacks where a malicious food label could cause
 * Gemini to return HTML/script content in string fields.
 *
 * Strips: HTML tags, null bytes, control characters from all string values.
 * Leaves: numbers, booleans, arrays, nested objects (recursively cleaned).
 */

const MAX_STRING_LENGTH = 2000;

export function sanitizeAiOutput(value, depth = 0) {
  if (depth > 8) return null;

  if (typeof value === 'string') {
    return value
      .replace(/<script[\s\S]*?<\/script>/gi, '')  // strip script blocks
      .replace(/<[^>]*>/g, '')                      // strip HTML tags
      .replace(/\0/g, '')                           // null bytes
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
      .slice(0, MAX_STRING_LENGTH)
      .trim();
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map(item => sanitizeAiOutput(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (typeof k !== 'string' || k.length > 100) continue;
      clean[k] = sanitizeAiOutput(v, depth + 1);
    }
    return clean;
  }

  // numbers, booleans, null — pass through
  return value;
}
