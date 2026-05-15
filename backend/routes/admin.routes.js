import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { getFirestore } from '../config/firebase.js';
import { getAuth } from '../config/firebase.js';
import logger from '../utils/logger.js';
import { badRequest, notFound } from '../utils/apiError.js';

const router = Router();

// ── GET /api/admin/verify ────────────────────────────────────────────────────
// Check if user is admin (no admin middleware — called before auth check)
router.get('/verify', authenticate, (req, res) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = (req.user?.email || '').toLowerCase();
  const isAdmin = adminEmails.includes(userEmail);

  if (isAdmin) {
    logger.debug('Admin verification succeeded', { email: userEmail, ip: req.ip });
  }

  res.json({
    isAdmin,
    email: req.user?.email,
    message: isAdmin ? 'User is admin' : 'User is not admin',
  });
});

// All other admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const db = getFirestore();

    // Get all users
    const usersSnap = await db.collection('users').get();
    const totalUsers = usersSnap.size;

    // Aggregate scan stats across all users
    let totalScans = 0;
    let totalHealthScore = 0;
    let scoreCount = 0;
    const foodFrequency = {};
    const verdictCounts = { HEALTHY: 0, MODERATE: 0, UNHEALTHY: 0 };
    const last7Days = {};

    // Build 7-day date keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days[d.toISOString().split('T')[0]] = 0;
    }

    // Sample up to 20 users for performance (full scan in production would use aggregation)
    const sampleUsers = usersSnap.docs.slice(0, 20);

    await Promise.all(sampleUsers.map(async (userDoc) => {
      const scansSnap = await db
        .collection('users').doc(userDoc.id)
        .collection('scans')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      scansSnap.docs.forEach(doc => {
        const data = doc.data();
        totalScans++;

        if (typeof data.healthScore === 'number') {
          totalHealthScore += data.healthScore;
          scoreCount++;
        }

        if (data.verdict) verdictCounts[data.verdict] = (verdictCounts[data.verdict] || 0) + 1;

        if (data.foodName) {
          foodFrequency[data.foodName] = (foodFrequency[data.foodName] || 0) + 1;
        }

        // Daily scan count
        const dateKey = data.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0];
        if (dateKey && last7Days[dateKey] !== undefined) {
          last7Days[dateKey]++;
        }
      });
    }));

    // Top 10 most scanned foods
    const topFoods = Object.entries(foodFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Community posts count
    const communitySnap = await db.collection('community').count().get();
    const totalPosts = communitySnap.data().count || 0;

    res.json({
      overview: {
        totalUsers,
        totalScans,
        totalPosts,
        avgHealthScore: scoreCount > 0 ? Math.round(totalHealthScore / scoreCount * 10) / 10 : 0,
      },
      verdictBreakdown: verdictCounts,
      dailyScans: Object.entries(last7Days).map(([date, count]) => ({ date, count })),
      topFoods,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const db    = getFirestore();
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const snap = await db.collection('users').limit(limit).get();

    const users = await Promise.all(snap.docs.map(async (doc) => {
      const data = doc.data();
      const scansSnap = await db
        .collection('users').doc(doc.id)
        .collection('scans')
        .count()
        .get();

      return {
        uid:       doc.id,
        name:      data.profile?.name || 'Unknown',
        email:     data.profile?.email || '',
        goal:      data.profile?.goal || '',
        tier:      data.profile?.tier || 'free',
        totalScans: scansSnap.data().count || 0,
        createdAt: data.profile?.createdAt,
      };
    }));

    res.json({ users, count: users.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/community ──────────────────────────────────────────────────
router.get('/community', async (req, res, next) => {
  try {
    const db    = getFirestore();
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const snap = await db.collection('community')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const posts = snap.docs.map(d => ({
      id:          d.id,
      userId:      d.data().userId,   // admin can see userId
      userName:    d.data().userName,
      foodName:    d.data().foodName,
      healthScore: d.data().healthScore,
      verdict:     d.data().verdict,
      caption:     d.data().caption,
      likes:       d.data().likes || 0,
      createdAt:   d.data().createdAt,
    }));

    res.json({ posts, count: posts.length });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/admin/community/:postId ───────────────────────────────────────
// Admin can delete any community post (moderation)
router.delete('/community/:postId', async (req, res, next) => {
  try {
    const db  = getFirestore();
    const ref = db.collection('community').doc(req.params.postId);
    const doc = await ref.get();

    if (!doc.exists) throw notFound('Post not found');

    await ref.delete();
    logger.info('Admin deleted community post', {
      adminEmail: req.user.email,
      postId:     req.params.postId,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/admin/users/:uid/ban ────────────────────────────────────────────
router.post('/users/:uid/ban', async (req, res, next) => {
  try {
    const auth = getAuth();
    await auth.updateUser(req.params.uid, { disabled: true });

    logger.info('Admin banned user', {
      adminEmail: req.user.email,
      targetUid:  req.params.uid,
    });

    res.json({ success: true, message: 'User banned' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/admin/users/:uid/unban ─────────────────────────────────────────
router.post('/users/:uid/unban', async (req, res, next) => {
  try {
    const auth = getAuth();
    await auth.updateUser(req.params.uid, { disabled: false });

    logger.info('Admin unbanned user', {
      adminEmail: req.user.email,
      targetUid:  req.params.uid,
    });

    res.json({ success: true, message: 'User unbanned' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/logs ───────────────────────────────────────────────────────
router.get('/logs', async (req, res, next) => {
  try {
    const fs   = await import('fs');
    const path = await import('path');
    const logPath = path.join(process.cwd(), 'logs', 'combined.log');

    if (!fs.existsSync(logPath)) {
      return res.json({ lines: [] });
    }

    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.trim().split('\n').slice(-100).reverse(); // last 100 lines
    res.json({ lines });
  } catch (err) {
    next(err);
  }
});

export default router;
