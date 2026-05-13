/**
 * Custom API error class.
 * Throw this anywhere in route/service code to send a structured error response.
 *
 * @example
 * throw new ApiError(400, 'No image provided');
 * throw new ApiError(429, 'Scan limit reached', { limit: 5, resetIn: '45 minutes' });
 * throw new ApiError(502, 'AI service temporarily unavailable');
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status code
   * @param {string} message     Human-readable error message
   * @param {object|null} details  Optional extra details sent to client
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Convenience factory helpers ──────────────────────────────────────────────

export const badRequest   = (msg, details) => new ApiError(400, msg, details);
export const unauthorized = (msg = 'Authentication required') => new ApiError(401, msg);
export const forbidden    = (msg = 'Access denied') => new ApiError(403, msg);
export const notFound     = (msg = 'Resource not found') => new ApiError(404, msg);
export const tooManyReqs  = (msg, details) => new ApiError(429, msg, details);
export const badGateway   = (msg = 'External service unavailable') => new ApiError(502, msg);
export const serverError  = (msg = 'Internal server error') => new ApiError(500, msg);
