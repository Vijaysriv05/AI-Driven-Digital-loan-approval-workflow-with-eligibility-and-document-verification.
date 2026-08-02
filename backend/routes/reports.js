import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const [reports] = await pool.query('SELECT * FROM reports ORDER BY generated_at DESC');
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
});

router.get('/download/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;

    if (type === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="nimbus_loan_report.pdf"');
      res.send(Buffer.from('%PDF-1.4 ... Nimbus Lending Executive Summary PDF Report'));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="nimbus_loan_report.csv"');
      res.send('Applicant Name,Loan Type,Amount,Status,Created At\nRavi Kumar,Personal Loan,250000,approved,2026-07-28\nAnanya Sharma,Home Loan,3500000,pending,2026-07-29\n');
    }
  } catch (err) {
    console.error('Error downloading report:', err);
    res.status(500).json({ message: 'Failed to download report.' });
  }
});

export default router;
