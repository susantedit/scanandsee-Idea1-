/**
 * Admin email list — checked client-side for routing only.
 * The real security check happens server-side in adminAuth.js middleware.
 * Client-side check is just for UX (redirect to admin panel).
 */
const ADMIN_EMAILS = [
  'susantedit@gmail.com',
];

/**
 * Check if an email belongs to an admin.
 * Case-insensitive.
 */
export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
