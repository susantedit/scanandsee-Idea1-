import { getFirestore } from '../config/firebase.js';
import { generateId, todayKey } from '../utils/helpers.js';
import { calculateDailyScore } from './score.service.js';
import { imageToDataUrl } from './image.service.js';
import logger from '../utils/logger.js';

// ── Scan operations ───────────────────────────────────────────────────────────

/**
 * Save a scan result to Firestore.
 * Converts imageBuffer to a base64 thumbnail (no Firebase Storage needed).
 * Also updates the user's daily log.
 * @param {string} userId
 * @param {object} analysisResult
 * @param {Buffer|null} imageBuffer - raw processed image buffer (optional)
 * @returns {string} scanId
 */
export async function saveScan(userId, analysisResult, imageBuffer = null) {
  const db = getFirestore();
  const scanId = generateId();
  const now = new Date();

  // Convert image to base64 thumbnail — free, no storage cost
  const imageDataUrl = imageBuffer ? await imageToDataUrl(imageBuffer) : null;

  const scanData = {
    imageUrl:         imageDataUrl || null,  // base64 thumbnail, no Firebase Storage needed
    foodName:         analysisResult.food_name,
    healthScore:      analysisResult.health_score,
    verdict:          analysisResult.verdict,
    calories:         analysisResult.calories,
    protein:          analysisResult.protein_g,
    carbs:            analysisResult.carbs_g,
    fats:             analysisResult.fats_g,
    sugar:            analysisResult.sugar_g,
    sodium:           analysisResult.sodium_mg,
    fiber:            analysisResult.fiber_g,
    servingSize:      analysisResult.serving_size || '1 serving',
    ingredients:      analysisResult.ingredients || [],
    warnings:         analysisResult.warnings || [],
    improvements:     analysisResult.improvements || [],
    gymAssessment:    analysisResult.gym_assessment || null,
    voiceExplanation: analysisResult.voice_explanation,
    createdAt:        now,
  };

  await db
    .collection('users').doc(userId)
    .collection('scans').doc(scanId)
    .set(scanData);

  // Update daily log
  await updateDailyLog(userId, scanData, now);

  logger.debug(`Scan saved: ${scanId} for user ${userId}`);
  return scanId;
}

/**
 * Get a single scan by ID.
 */
export async function getScan(userId, scanId) {
  const db = getFirestore();
  const doc = await db
    .collection('users').doc(userId)
    .collection('scans').doc(scanId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Get paginated scan history for a user.
 */
export async function getScanHistory(userId, limit = 20, offset = 0) {
  const db = getFirestore();
  const snapshot = await db
    .collection('users').doc(userId)
    .collection('scans')
    .orderBy('createdAt', 'desc')
    .limit(limit + offset)
    .get();

  const docs = snapshot.docs.slice(offset);
  return docs.map(doc => ({
    id:          doc.id,
    foodName:    doc.data().foodName,
    healthScore: doc.data().healthScore,
    verdict:     doc.data().verdict,
    calories:    doc.data().calories,
    imageUrl:    doc.data().imageUrl,
    createdAt:   doc.data().createdAt?.toDate?.() || doc.data().createdAt,
  }));
}

/**
 * Delete a scan.
 */
export async function deleteScan(userId, scanId) {
  const db = getFirestore();
  await db
    .collection('users').doc(userId)
    .collection('scans').doc(scanId)
    .delete();
}

// ── User profile operations ───────────────────────────────────────────────────

/**
 * Get user profile. Returns null if not found.
 */
export async function getProfile(userId) {
  const db = getFirestore();
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return data.profile || null;
}

/**
 * Create or update user profile.
 */
export async function saveProfile(userId, profileData) {
  const db = getFirestore();
  const now = new Date();

  await db.collection('users').doc(userId).set(
    {
      profile: {
        ...profileData,
        updatedAt: now,
      },
    },
    { merge: true }
  );

  // Ensure createdAt is set on first save
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.data()?.profile?.createdAt) {
    await db.collection('users').doc(userId).update({
      'profile.createdAt': now,
    });
  }
}

/**
 * Get user statistics.
 */
export async function getUserStats(userId) {
  const db = getFirestore();

  const scansSnap = await db
    .collection('users').doc(userId)
    .collection('scans')
    .orderBy('createdAt', 'desc')
    .get();

  const scans = scansSnap.docs.map(d => d.data());
  const totalScans = scans.length;
  const avgScore = totalScans > 0
    ? Math.round(scans.reduce((sum, s) => sum + (s.healthScore || 0), 0) / totalScans * 10) / 10
    : 0;

  // Calculate streak (consecutive days with at least 1 scan)
  const streak = calculateStreak(scans);

  const userDoc = await db.collection('users').doc(userId).get();
  const memberSince = userDoc.data()?.profile?.createdAt?.toDate?.() || new Date();

  return { totalScans, avgScore, streak, memberSince };
}

// ── Daily log operations ──────────────────────────────────────────────────────

/**
 * Update the daily nutrition log after a scan.
 */
export async function updateDailyLog(userId, scanData, date = new Date()) {
  const db = getFirestore();
  const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const ref = db
    .collection('users').doc(userId)
    .collection('dailyLogs').doc(dateKey);

  const doc = await ref.get();
  const existing = doc.exists ? doc.data() : {
    totalCalories: 0, totalProtein: 0, totalCarbs: 0,
    totalFats: 0, totalSugar: 0, scansCount: 0, scanRefs: [],
  };

  const updated = {
    totalCalories: (existing.totalCalories || 0) + (scanData.calories || 0),
    totalProtein:  (existing.totalProtein  || 0) + (scanData.protein  || 0),
    totalCarbs:    (existing.totalCarbs    || 0) + (scanData.carbs    || 0),
    totalFats:     (existing.totalFats     || 0) + (scanData.fats     || 0),
    totalSugar:    (existing.totalSugar    || 0) + (scanData.sugar    || 0),
    scansCount:    (existing.scansCount    || 0) + 1,
    scanRefs:      [...(existing.scanRefs  || []), scanData.id].filter(Boolean),
    date:          dateKey,
  };
  updated.nutritionScore = calculateDailyScore(updated);

  await ref.set(updated, { merge: true });
}

/**
 * Get today's daily log.
 */
export async function getDailyLog(userId, dateKey = todayKey()) {
  const db = getFirestore();
  const doc = await db
    .collection('users').doc(userId)
    .collection('dailyLogs').doc(dateKey)
    .get();

  if (!doc.exists) {
    return {
      totalCalories: 0, totalProtein: 0, totalCarbs: 0,
      totalFats: 0, totalSugar: 0, scansCount: 0, nutritionScore: 5,
    };
  }
  return doc.data();
}

/**
 * Get weekly logs (last 7 days).
 */
export async function getWeeklyLogs(userId) {
  const db = getFirestore();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const results = await Promise.all(
    days.map(async (dateKey) => {
      const log = await getDailyLog(userId, dateKey);
      return { date: dateKey, ...log };
    })
  );

  return results;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calculateStreak(scans) {
  if (!scans.length) return 0;

  const scanDays = new Set(
    scans.map(s => {
      const d = s.createdAt?.toDate?.() || new Date(s.createdAt);
      return d.toISOString().split('T')[0];
    })
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (scanDays.has(key)) {
      streak++;
    } else if (i > 0) {
      break; // streak broken
    }
  }

  return streak;
}
