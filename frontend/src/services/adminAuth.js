/**
 * Admin authentication service.
 * Manages admin access control and verification.
 */

const ADMIN_EMAILS = [
  'susantedit@gmail.com',
  // Add more admin emails here
];

/**
 * Check if email is in the admin list (local cache).
 * Use this for immediate UI decisions (e.g., showing admin button).
 * 
 * @param {string} email - User's email address
 * @returns {boolean} True if email is admin
 */
export function isUserAdmin(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Verify admin access with backend.
 * Use this after authentication to confirm server-side admin status.
 * 
 * @param {string} token - Firebase ID token
 * @returns {Promise<boolean>} True if user is admin
 */
export async function verifyAdminAccess(token) {
  try {
    const response = await fetch('/api/admin/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.isAdmin === true;
  } catch (error) {
    console.error('Admin verification failed:', error);
    return false;
  }
}

/**
 * Add an admin email (client-side storage).
 * This doesn't persist to backend - for demo/testing only.
 */
export function addAdminEmail(email) {
  if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
    ADMIN_EMAILS.push(email.toLowerCase());
  }
}

/**
 * Remove an admin email (client-side storage).
 * This doesn't persist to backend - for demo/testing only.
 */
export function removeAdminEmail(email) {
  const index = ADMIN_EMAILS.findIndex(e => e === email.toLowerCase());
  if (index > -1) {
    ADMIN_EMAILS.splice(index, 1);
  }
}

/**
 * Get all admin emails (client-side cache).
 */
export function getAdminEmails() {
  return [...ADMIN_EMAILS];
}
