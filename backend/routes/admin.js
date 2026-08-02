import express from 'express';
import pool from '../config/db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply requireAdmin middleware to ALL admin routes
router.use(requireAdmin);

// Admin Executive Dashboard Overview
router.get('/dashboard', async (req, res) => {
  try {
    const [allApps] = await pool.query('SELECT * FROM applications');
    const [allUsers] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');

    const totalApplications = allApps.length;
    const approvedLoans = allApps.filter((a) => a.status === 'approved').length;
    const pendingLoans = allApps.filter((a) => a.status === 'pending').length;
    const rejectedLoans = allApps.filter((a) => a.status === 'rejected').length;

    const totalDisbursedAmount = allApps
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + Number(a.loan_amount || 0), 0);

    const pendingQueue = allApps.filter((a) => a.status === 'pending').slice(0, 5);

    const trend = [
      { month: 'Jan', approved: 12, rejected: 3 },
      { month: 'Feb', approved: 19, rejected: 4 },
      { month: 'Mar', approved: 25, rejected: 5 },
      { month: 'Apr', approved: 32, rejected: 6 },
      { month: 'May', approved: 28, rejected: 4 },
      { month: 'Jun', approved: 45, rejected: 8 },
      { month: 'Jul', approved: approvedLoans || 52, rejected: rejectedLoans || 9 },
    ];

    res.json({
      metrics: {
        totalApplications,
        approvedLoans,
        pendingLoans,
        rejectedLoans,
        totalDisbursedAmount,
        totalUsersCount: allUsers.length,
      },
      trend,
      pendingQueue,
      recentUsers: allUsers.slice(0, 5),
    });
  } catch (err) {
    console.error('Error fetching admin dashboard:', err);
    res.status(500).json({ message: 'Failed to load admin dashboard.' });
  }
});

// View All Registered Users
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, phone, employment_type, monthly_income, credit_score, created_at FROM users ORDER BY id DESC');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch registered users.' });
  }
});

// Search & Filter All Applications
router.get('/applications', async (req, res) => {
  try {
    const { search, status, loan_type } = req.query;

    let sql = 'SELECT * FROM applications WHERE 1=1';
    const params = {};

    if (status) {
      sql += ' AND status = :status';
      params.status = status;
    }

    if (loan_type) {
      sql += ' AND loan_type = :loan_type';
      params.loan_type = loan_type;
    }

    if (search) {
      sql += ' AND (applicant_name LIKE :search OR email LIKE :search OR phone LIKE :search)';
      params.search = `%${search}%`;
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listing admin applications:', err);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
});

// Approve or Reject Application with Admin Comments
router.post('/decision/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, admin_comment } = req.body; // 'approve', 'reject', 'request_document'

    let newStatus = 'pending';
    let newStage = 'Under Review';

    if (action === 'approve') {
      newStatus = 'approved';
      newStage = 'Approved';
    } else if (action === 'reject') {
      newStatus = 'rejected';
      newStage = 'Rejected';
    } else if (action === 'request_document') {
      newStage = 'Document Verification';
    }

    await pool.query(
      `UPDATE applications
       SET status = :newStatus,
           status_stage = :newStage,
           admin_comment = :admin_comment,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      {
        id,
        newStatus,
        newStage,
        admin_comment: admin_comment || (action === 'approve' ? 'Approved after document & AI risk validation.' : 'Rejected based on eligibility threshold criteria.'),
      }
    );

    // Notify user
    const [apps] = await pool.query('SELECT created_by, applicant_name FROM applications WHERE id = :id', { id });
    const app = apps[0];

    if (app && app.created_by) {
      await pool.query(
        'INSERT INTO notifications (user_id, message) VALUES (:userId, :message)',
        {
          userId: app.created_by,
          message: `Application #${id} status updated to ${newStatus.toUpperCase()}. Note: ${admin_comment || 'Process completed.'}`,
        }
      );
    }

    const [updated] = await pool.query('SELECT * FROM applications WHERE id = :id', { id });
    res.json({ message: `Decision recorded: Application ${newStatus}.`, application: updated[0] });
  } catch (err) {
    console.error('Error recording admin decision:', err);
    res.status(500).json({ message: 'Failed to record application decision.' });
  }
});

// Dynamic Loan Criteria (Get & Put)
router.get('/criteria', async (req, res) => {
  try {
    const [rules] = await pool.query('SELECT * FROM loan_criteria ORDER BY id ASC');
    res.json(rules);
  } catch (err) {
    console.error('Error fetching loan criteria:', err);
    res.status(500).json({ message: 'Failed to fetch loan criteria rules.' });
  }
});

router.put('/criteria/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { min_income, min_credit_score, max_loan_amount, min_age, max_age, max_debt_ratio } = req.body;

    await pool.query(
      `UPDATE loan_criteria
       SET min_income = :min_income,
           min_credit_score = :min_credit_score,
           max_loan_amount = :max_loan_amount,
           min_age = :min_age,
           max_age = :max_age,
           max_debt_ratio = :max_debt_ratio
       WHERE id = :id`,
      {
        id,
        min_income: Number(min_income),
        min_credit_score: Number(min_credit_score),
        max_loan_amount: Number(max_loan_amount),
        min_age: Number(min_age),
        max_age: Number(max_age),
        max_debt_ratio: Number(max_debt_ratio),
      }
    );

    const [updated] = await pool.query('SELECT * FROM loan_criteria WHERE id = :id', { id });
    res.json({ message: 'Dynamic loan criteria updated successfully.', rule: updated[0] });
  } catch (err) {
    console.error('Error updating loan criteria:', err);
    res.status(500).json({ message: 'Failed to update loan criteria.' });
  }
});

// Manage Loan Products & Interest Rates
router.get('/loan-products', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM loan_products ORDER BY id ASC');
    res.json(products);
  } catch (err) {
    console.error('Error fetching loan products:', err);
    res.status(500).json({ message: 'Failed to fetch loan products.' });
  }
});

router.put('/loan-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { interest_rate, min_amount, max_amount, min_tenure, max_tenure, description } = req.body;

    await pool.query(
      `UPDATE loan_products
       SET interest_rate = :interest_rate,
           min_amount = :min_amount,
           max_amount = :max_amount,
           min_tenure = :min_tenure,
           max_tenure = :max_tenure,
           description = :description
       WHERE id = :id`,
      {
        id,
        interest_rate: Number(interest_rate),
        min_amount: Number(min_amount),
        max_amount: Number(max_amount),
        min_tenure: Number(min_tenure),
        max_tenure: Number(max_tenure),
        description: description || '',
      }
    );

    const [updated] = await pool.query('SELECT * FROM loan_products WHERE id = :id', { id });
    res.json({ message: 'Loan product parameters updated.', product: updated[0] });
  } catch (err) {
    console.error('Error updating loan product:', err);
    res.status(500).json({ message: 'Failed to update loan product.' });
  }
});

// Delete Application by ID (Admin)
router.delete('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM documents WHERE application_id = :id', { id });
    await pool.query('DELETE FROM eligibility WHERE application_id = :id', { id });
    await pool.query('DELETE FROM applications WHERE id = :id', { id });

    res.json({ message: `Application #${id} deleted successfully.` });
  } catch (err) {
    console.error('Error deleting application:', err);
    res.status(500).json({ message: 'Failed to delete application.' });
  }
});

export default router;
