import { initializeApp } from 'firebase/app';
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
let app, auth;

try {
  if (firebaseConfig.apiKey) {
    app  = initializeApp(firebaseConfig);
    auth = getAuth(app);
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
