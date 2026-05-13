/**
 * Security headers middleware.
 * Supplements helmet with app-specific headers.
 *
 * Applied globally in index.js after helmet.
 */
export function securityHeaders(req, res, next) {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Disable browser caching for API responses (contains user data)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  // Remove server fingerprint (helmet removes X-Powered-By but add this too)
  res.removeHeader('Server');

  // Referrer policy — don't leak API URL in referrer headers
  res.setHeader('Referrer-Policy', 'no-referrer');

  // Permissions policy — restrict browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // HSTS — enforce HTTPS for 1 year (only set in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
}
