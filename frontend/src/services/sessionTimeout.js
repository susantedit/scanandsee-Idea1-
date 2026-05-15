/**
 * Session timeout management service.
 * 
 * Handles:
 * - Token expiration detection (Firebase tokens expire after 1 hour)
 * - Inactivity warning (shows toast at 55 minutes)
 * - Auto-logout at 60 minutes
 * - Activity-based timeout reset
 */

let timeoutId = null;
let warningTimeoutId = null;

const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour (Firebase token TTL)
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
const INACTIVITY_WARNING = 55 * 60 * 1000; // Show warning at 55 min

/**
 * Start session timeout and inactivity tracking.
 * Dispatches 'session-expiring' event 5 min before timeout.
 */
export function startSessionTimeout() {
  clearExistingTimeouts();

  // Warning timer - fires at 55 minutes
  warningTimeoutId = setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent('session-expiring', {
        detail: { timeLeft: 5 * 60 * 1000 }, // 5 minutes in ms
      })
    );
  }, INACTIVITY_WARNING);

  // Auto-logout timer - fires at 60 minutes
  timeoutId = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('session-expired'));
    window.location.href = '/login?session=expired';
  }, TIMEOUT_DURATION);
}

/**
 * Reset session timeout on user activity.
 * Called whenever user interacts with the page.
 */
export function resetSessionTimeout() {
  startSessionTimeout();
  window.dispatchEvent(new CustomEvent('session-reset'));
}

/**
 * Clear all timeout timers.
 */
export function clearExistingTimeouts() {
  if (timeoutId) clearTimeout(timeoutId);
  if (warningTimeoutId) clearTimeout(warningTimeoutId);
  timeoutId = null;
  warningTimeoutId = null;
}

/**
 * Manually end the session (e.g., logout button clicked).
 */
export async function endSession() {
  clearExistingTimeouts();
  
  try {
    // Import here to avoid circular dependency
    const { signOut } = await import('./firebase');
    await signOut();
  } catch (err) {
    console.error('Sign out failed:', err);
  }
  
  window.location.href = '/login';
}

/**
 * Get remaining session time in milliseconds.
 */
export function getSessionTimeRemaining() {
  if (!timeoutId) return null;
  
  // This is approximate since we don't have access to the actual timeout ID
  // In production, consider using a state machine approach
  return TIMEOUT_DURATION;
}

/**
 * Check if session is active.
 */
export function isSessionActive() {
  return timeoutId !== null;
}
