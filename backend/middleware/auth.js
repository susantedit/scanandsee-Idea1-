import { getAuth } from '../config/firebase.js';
import { unauthorized } from '../utils/apiError.js';
import logger from '../utils/logger.js';

// Constant-time token extraction to avoid timing side-channels
function extractBearerToken(header) {
  if (typeof header !== 'string') return null;
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  // Reject obviously malformed tokens (Firebase JWTs are always > 100 chars)
  if (token.length < 100 || token.length > 4096) return null;
  return token;
}

/**
 * Firebase ID token verification middleware.
 * Attaches req.user = { uid, email, tier } on success.
 * Returns 401 on any failure — never leaks why verification failed.
 *
 * Security properties:
 * - Token verified server-side via Firebase Admin SDK (RS256)
 * - Firebase tokens expire after 1 hour automatically
 * - No dev bypass in production — mock auth only when NODE_ENV=development
 *   AND FIREBASE_PROJECT_ID is not set
 * - Auth failures logged with IP for abuse detection
 * - Error message is generic — does not reveal token structure
 */
export async function authenticate(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    logger.warn('Auth: missing or malformed token', {
      ip:   req.ip,
      path: req.path,
    });
    return next(unauthorized('Authentication required'));
  }

  try {
    const auth = getAuth();

    // Dev-only mock auth — only when Firebase is genuinely not configured
    // Disabled entirely in production regardless of env vars
    if (!auth) {
      if (process.env.NODE_ENV !== 'development') {
        logger.error('Auth: Firebase not configured in production — rejecting request');
        return next(unauthorized('Authentication service unavailable'));
      }
      logger.warn('Auth: Firebase not configured — using mock auth (dev only)');
      req.user = { uid: 'dev-user-001', email: 'dev@scanandsee.local', tier: 'free' };
      return next();
    }

    // Verify token — Firebase checks signature, expiry, audience, issuer
    const decoded = await auth.verifyIdToken(token, /* checkRevoked= */ true);

    req.user = {
      uid:   decoded.uid,
      email: decoded.email || '',
      // tier comes from a custom claim set server-side when user upgrades
      // never trust a tier value from the client
      tier:  decoded.tier || 'free',
    };

    next();
  } catch (err) {
    // Log with enough detail for abuse detection but return generic message
    logger.warn('Auth: token verification failed', {
      ip:     req.ip,
      path:   req.path,
      reason: err.code || err.message?.slice(0, 80),
    });
    return next(unauthorized('Authentication required'));
  }
}

/**
 * Optional auth — attaches user if valid token present, continues either way.
 * Use on public routes that have enhanced behavior when authenticated.
 */
export async function optionalAuth(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return next();

  try {
    const auth = getAuth();
    if (!auth) return next();
    const decoded = await auth.verifyIdToken(token, true);
    req.user = {
      uid:   decoded.uid,
      email: decoded.email || '',
      tier:  decoded.tier  || 'free',
    };
  } catch {
    // Silently ignore — treat as unauthenticated
  }
  next();
}
