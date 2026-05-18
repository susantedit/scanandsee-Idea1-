import { Router } from 'express';
import { getFirestore } from '../config/firebase.js';

const router = Router();

// POST /api/enterprise/inquiry
router.post('/inquiry', async (req, res, next) => {
  try {
    const { email, company, plan } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const db = getFirestore();
    const data = {
      email,
      company: company || '',
      plan: plan || 'Unknown',
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    await db.collection('enterprise_inquiries').add(data);
    res.json({ success: true, message: 'Inquiry received' });
  } catch (err) {
    next(err);
  }
});

export default router;
