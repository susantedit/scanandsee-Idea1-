import { ApiError } from '../utils/apiError.js';
import logger from '../utils/logger.js';

/**
 * Global Express error handler.
 * Must be registered LAST with app.use() in index.js.
 *
 * Security properties:
 * - Stack traces NEVER sent to client in production
 * - Internal error details stripped from 500 responses
 * - All errors logged with context for monitoring
 * - Multer errors normalized to 400
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Normalize multer errors
  if (err.name === 'MulterError') {
    err = new ApiError(400, `Upload error: ${err.message}`);
  }

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  // For 5xx errors, log full detail internally but send generic message to client
  const clientMessage = statusCode >= 500
    ? 'An unexpected error occurred. Please try again.'
    : (err.message || 'Request failed');

  const details = isClientError ? (err.details || undefined) : undefined;

  // Structured log — includes enough context for abuse detection and debugging
  const logPayload = {
    statusCode,
    method:  req.method,
    path:    req.path,
    ip:      req.ip,
    uid:     req.user?.uid || 'unauthenticated',
    ua:      req.headers['user-agent']?.slice(0, 200),
  };

  if (statusCode >= 500) {
    logger.error(`${statusCode} ${req.method} ${req.path} — ${err.message}`, {
      ...logPayload,
      stack: err.stack,
    });
  }
  
  // If upstream provided retry info (e.g. AI quota), include `Retry-After` header
  if (statusCode === 429 && err.details?.retryInSeconds) {
    try {
      res.setHeader('Retry-After', String(err.details.retryInSeconds));
    } catch (e) {
      // non-fatal — continue to send JSON body
    }
  } else if (statusCode === 429) {
    // Rate limit hits get their own log level for abuse monitoring
    logger.warn(`RATE_LIMIT ${req.method} ${req.path}`, logPayload);
  } else if (statusCode === 401 || statusCode === 403) {
    logger.warn(`AUTH_FAIL ${statusCode} ${req.method} ${req.path}`, logPayload);
  } else {
    logger.debug(`${statusCode} ${req.method} ${req.path} — ${err.message}`, logPayload);
  }

  res.status(statusCode).json({
    error:   clientMessage,
    details: details,
    // Never include stack, internal message, or DB details in production
  });
}

/**
 * 404 handler — register before errorHandler but after all routes.
 */
export function notFoundHandler(req, res, next) {
  // Don't log 404s for common scanner probes to reduce noise
  const probePaths = ['/wp-admin', '/phpMyAdmin', '/.env', '/admin', '/config'];
  if (!probePaths.some(p => req.path.startsWith(p))) {
    logger.debug(`404 ${req.method} ${req.path}`, { ip: req.ip });
  }
  next(new ApiError(404, 'Not found'));
}
