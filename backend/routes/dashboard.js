import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', requireAuth, async (req, res) => {
  try {
    const [allApps] = await pool.query('SELECT status FROM applications');

    const kpis = {
      applications: allApps.length,
      approved: allApps.filter((a) => a.status === 'approved').length,
      pending: allApps.filter((a) => a.status === 'pending').length,
      rejected: allApps.filter((a) => a.status === 'rejected').length,
    };

    const [recentApplications] = await pool.query(
      'SELECT id, applicant_name, loan_amount, status, created_at FROM applications ORDER BY created_at DESC LIMIT 5'
    );

    const [notifications] = await pool.query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5'
    );

    const trend = [
      { month: 'Jan', approved: 12 },
      { month: 'Feb', approved: 19 },
      { month: 'Mar', approved: 25 },
      { month: 'Apr', approved: 32 },
      { month: 'May', approved: 28 },
      { month: 'Jun', approved: 45 },
      { month: 'Jul', approved: kpis.approved || 52 },
    ];

    res.json({
      kpis,
      trend,
      recentApplications,
      notifications,
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard summary.' });
  }
});

export default router;
