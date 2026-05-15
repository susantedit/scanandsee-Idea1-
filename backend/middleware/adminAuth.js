import { forbidden } from '../utils/apiError.js';
import logger from '../utils/logger.js';

/**
 * Admin authorization middleware.
 * Must be used AFTER authenticate() — requires req.user to be set.
 *
 * Admin emails are defined in ADMIN_EMAILS env var (comma-separated).
 * Never trust client-side admin claims — always verify server-side.
 *
 * Security:
 * - Email comparison is case-insensitive
 * - Admin access attempts are always logged
 * - Non-admins get a generic 403 — no info leakage
 */
export function requireAdmin(req, res, next) {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = (req.user?.email || '').toLowerCase();

  if (!userEmail || !adminEmails.includes(userEmail)) {
    logger.warn('Admin access denied', {
      ip:    req.ip,
      uid:   req.user?.uid,
      email: userEmail,
      path:  req.path,
    });
    return next(forbidden('Admin access required'));
  }

  logger.info('Admin access granted', {
    email: userEmail,
    path:  req.path,
    ip:    req.ip,
  });

  req.user.isAdmin = true;
  next();
}
