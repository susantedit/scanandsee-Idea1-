import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getIdToken,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase (only if config is present)
let app, auth, analytics = null;

try {
  if (firebaseConfig.apiKey) {
    app  = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Initialize Analytics only when measurement id is provided
    if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        // Analytics may fail in non-browser or restricted contexts
        console.warn('Firebase analytics init failed', e.message);
        analytics = null;
      }
    }
  }
} catch (err) {
  console.warn('Firebase init failed — running in demo mode', err.message);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google popup.
 */
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase not configured');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out current user.
 */
export async function signOut() {
  if (!auth) return;
  await firebaseSignOut(auth);
}

/**
 * Get the current user's ID token (refreshed).
 * Call this before every API request.
 */
export async function getAuthToken() {
  if (!auth?.currentUser) return null;
  return getIdToken(auth.currentUser, true);
}

/**
 * Subscribe to auth state changes.
 * @param {Function} callback - called with user or null
 * @returns unsubscribe function
 */
export function onAuthChange(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { auth };

/**
 * Track a lightweight analytics event if analytics is available.
 * Safe to call from UI code without throwing.
 */
export function trackEvent(name, params = {}) {
  if (!analytics) return;
  try { logEvent(analytics, name, params); } catch (e) { /* ignore */ }
}
