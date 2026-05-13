import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticate } from '../middleware/auth.js';
import { globalLimiter, chatLimiter } from '../middleware/rateLimiter.js';
import { validate, validateQuery, validateParams } from '../middleware/validate.js';
import { getFirestore } from '../config/firebase.js';
import { getProfile } from '../services/firebase.service.js';
import { badRequest, notFound, tooManyReqs } from '../utils/apiError.js';
import { generateId } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const router = Router();
router.use(authenticate);

// ── Schemas ───────────────────────────────────────────────────────────────────

const ShareSchema = z.object({
  scanId:  z.string().regex(/^[a-f0-9]{32}$/, 'Invalid scan ID'),
  // Sanitize caption — strip any HTML/script tags, limit length
  caption: z.string().max(200).trim()
    .transform(s => s.replace(/<[^>]*>/g, '').replace(/[<>]/g, ''))
    .optional()
    .default(''),
});

const PostIdSchema = z.object({
  postId: z.string().regex(/^[a-f0-9]{32}$/, 'Invalid post ID'),
});

const FeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── POST /api/community/share ─────────────────────────────────────────────────
router.post('/share', chatLimiter, validate(ShareSchema), async (req, res, next) => {
  try {
    const db      = getFirestore();
    const profile = await getProfile(req.user.uid);
    const { scanId, caption } = req.body;

    // IDOR: verify scan belongs to this user before sharing it
    const scanDoc = await db
      .collection('users').doc(req.user.uid)
      .collection('scans').doc(scanId)
      .get();

    if (!scanDoc.exists) throw notFound('Scan not found');

    // Prevent duplicate shares of the same scan
    const existing = await db.collection('community')
      .where('userId', '==', req.user.uid)
      .where('scanId', '==', scanId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(200).json({ success: true, postId: existing.docs[0].id, alreadyShared: true });
    }

    const scan   = scanDoc.data();
    const postId = generateId();

    await db.collection('community').doc(postId).set({
      postId,
      userId:      req.user.uid,
      // Never expose email — only display name
      userName:    (profile?.name || 'Anonymous').slice(0, 50),
      scanId,
      foodName:    (scan.foodName || '').slice(0, 200),
      healthScore: typeof scan.healthScore === 'number' ? scan.healthScore : 0,
      verdict:     ['HEALTHY', 'MODERATE', 'UNHEALTHY'].includes(scan.verdict) ? scan.verdict : 'MODERATE',
      calories:    typeof scan.calories === 'number' ? scan.calories : 0,
      // Only share thumbnail — already a small base64 stored in Firestore
      imageUrl:    scan.imageUrl || null,
      caption,
      likes:       0,
      createdAt:   new Date(),
    });

    logger.info('Community share created', { uid: req.user.uid, postId, scanId });
    res.status(201).json({ success: true, postId });
  } catch (err) { next(err); }
});

// ── GET /api/community/feed ───────────────────────────────────────────────────
router.get('/feed', validateQuery(FeedQuerySchema), async (req, res, next) => {
  try {
    const db    = getFirestore();
    const limit = req.query.limit;

    const snap = await db.collection('community')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const posts = snap.docs.map(d => {
      const data = d.data();
      return {
        id:          d.id,
        // Never expose userId — privacy protection
        userName:    data.userName,
        foodName:    data.foodName,
        healthScore: data.healthScore,
        verdict:     data.verdict,
        calories:    data.calories,
        imageUrl:    data.imageUrl,
        caption:     data.caption,
        likes:       data.likes || 0,
        createdAt:   data.createdAt,
        // Flag if this post belongs to the requesting user (for delete button)
        isOwn:       data.userId === req.user.uid,
      };
    });

    res.json({ posts, count: posts.length });
  } catch (err) { next(err); }
});

// ── POST /api/community/:postId/like ─────────────────────────────────────────
// Rate limited — prevents like-bombing
router.post(
  '/:postId/like',
  globalLimiter,
  validateParams(PostIdSchema),
  async (req, res, next) => {
    try {
      const db  = getFirestore();
      const ref = db.collection('community').doc(req.params.postId);
      const doc = await ref.get();
      if (!doc.exists) throw notFound('Post not found');

      // Prevent self-liking
      if (doc.data().userId === req.user.uid) {
        return res.status(400).json({ error: 'Cannot like your own post' });
      }

      // Check if already liked (using a subcollection to track unique likes)
      const likeRef = ref.collection('likedBy').doc(req.user.uid);
      const likeDoc = await likeRef.get();
      if (likeDoc.exists) {
        return res.status(200).json({ success: true, alreadyLiked: true });
      }

      // Atomic increment — prevents race conditions
      await Promise.all([
        ref.update({ likes: FieldValue.increment(1) }),
        likeRef.set({ likedAt: new Date() }),
      ]);

      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

// ── DELETE /api/community/:postId ─────────────────────────────────────────────
// Users can delete their own posts
router.delete(
  '/:postId',
  validateParams(PostIdSchema),
  async (req, res, next) => {
    try {
      const db  = getFirestore();
      const ref = db.collection('community').doc(req.params.postId);
      const doc = await ref.get();

      if (!doc.exists) throw notFound('Post not found');

      // IDOR: only the owner can delete their post
      if (doc.data().userId !== req.user.uid) {
        throw notFound('Post not found'); // Don't reveal existence to non-owners
      }

      await ref.delete();
      logger.info('Community post deleted', { uid: req.user.uid, postId: req.params.postId });
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

// ── GET /api/community/leaderboard ────────────────────────────────────────────
router.get('/leaderboard', async (req, res, next) => {
  try {
    const db = getFirestore();

    const snap = await db.collection('community')
      .orderBy('healthScore', 'desc')
      .limit(50)
      .get();

    // Aggregate by user — never expose userId
    const userMap = {};
    snap.docs.forEach(d => {
      const data = d.data();
      const key  = data.userId; // used only as map key, never returned
      if (!userMap[key]) {
        userMap[key] = { userName: data.userName, scores: [], totalScans: 0 };
      }
      userMap[key].scores.push(typeof data.healthScore === 'number' ? data.healthScore : 0);
      userMap[key].totalScans++;
    });

    const leaderboard = Object.values(userMap)
      .map(u => ({
        userName:   u.userName,
        totalScans: u.totalScans,
        avgScore:   Math.round(u.scores.reduce((a, b) => a + b, 0) / u.scores.length * 10) / 10,
        // userId intentionally omitted — privacy
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    res.json({ leaderboard });
  } catch (err) { next(err); }
});

export default router;
