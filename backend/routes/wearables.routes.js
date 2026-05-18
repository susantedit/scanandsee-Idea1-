import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getFirestore } from '../config/firebase.js';

const router = Router();
router.use(authenticate);

// GET /api/wearables
router.get('/', async (req, res, next) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('users').doc(req.user.uid).collection('wearables').doc('latest').get();
    
    if (!doc.exists) {
      return res.json(null);
    }
    res.json(doc.data());
  } catch (err) {
    next(err);
  }
});

// POST /api/wearables
router.post('/', async (req, res, next) => {
  try {
    const db = getFirestore();
    const data = {
      ...req.body,
      syncedAt: new Date().toISOString()
    };
    await db.collection('users').doc(req.user.uid).collection('wearables').doc('latest').set(data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
