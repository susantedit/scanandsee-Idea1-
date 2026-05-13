import admin from 'firebase-admin';
import logger from '../utils/logger.js';

let firebaseApp;

/**
 * Initialize Firebase Admin SDK (singleton).
 * Called once at server startup from index.js.
 */
export function initFirebase() {
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0];
    return firebaseApp;
  }

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL,
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    logger.warn('Firebase env vars missing — running without Firebase (dev mode)');
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId:    FIREBASE_PROJECT_ID,
        privateKey:   FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail:  FIREBASE_CLIENT_EMAIL,
      }),
      // No storageBucket needed — images stored as base64 in Firestore
    });

    logger.info(`Firebase Admin initialized — project: ${FIREBASE_PROJECT_ID}`);
    return firebaseApp;
  } catch (err) {
    logger.error('Firebase Admin init failed', { error: err.message });
    throw err;
  }
}

/**
 * Get Firestore instance.
 */
export function getFirestore() {
  return admin.firestore();
}

/**
 * Get Firebase Auth instance.
 */
export function getAuth() {
  return admin.auth();
}

export default admin;
