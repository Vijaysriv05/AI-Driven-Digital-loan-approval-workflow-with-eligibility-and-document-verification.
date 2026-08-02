import express from 'express';
import pool from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// List Applications (Users see ONLY their own applications; Admins see ALL applications)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, status } = req.query;

    let sql = 'SELECT * FROM applications WHERE 1=1';
    const params = {};

    // Scope to user ID if not admin
    if ((req.user?.role || 'user').toLowerCase() !== 'admin') {
      sql += ' AND created_by = :userId';
      params.userId = req.user.id;
    }

    if (status) {
      sql += ' AND status = :status';
      params.status = status;
    }

    if (search) {
      sql += ' AND (applicant_name LIKE :search OR email LIKE :search OR loan_type LIKE :search)';
      params.search = `%${search}%`;
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listing applications:', err);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
});

// Create New Loan Application
router.post('/', requireAuth, async (req, res) => {
  try {
    const { applicant_name, email, phone, loan_type, loan_amount, tenure_months, purpose } = req.body;

    if (!applicant_name || !loan_type || !loan_amount) {
      return res.status(400).json({ message: 'Applicant name, loan type, and loan amount are required.' });
    }

    const createdBy = req.user?.id || null;

    const [result] = await pool.query(
      `INSERT INTO applications (applicant_name, email, phone, loan_type, loan_amount, tenure_months, purpose, status, status_stage, created_by)
       VALUES (:applicant_name, :email, :phone, :loan_type, :loan_amount, :tenure_months, :purpose, 'pending', 'Submitted', :created_by)`,
      {
        applicant_name,
        email: email || req.user?.email || '',
        phone: phone || '',
        loan_type,
        loan_amount: Number(loan_amount),
        tenure_months: Number(tenure_months) || 12,
        purpose: purpose || '',
        created_by: createdBy,
      }
    );

    const applicationId = result.insertId;

    // Auto-create document placeholders
    const defaultDocTypes = ['aadhaar', 'pan', 'salary_slip', 'bank_statement'];
    for (const dt of defaultDocTypes) {
      try {
        await pool.query(
          `INSERT INTO documents (application_id, doc_type, status) VALUES (:applicationId, :dt, 'missing')`,
          { applicationId, dt }
        );
      } catch (e) {}
    }

    // Add notification safely
    try {
      await pool.query(
        'INSERT INTO notifications (user_id, message) VALUES (:userId, :message)',
        { userId: createdBy, message: `New application #${applicationId} created for ${applicant_name}.` }
      );
    } catch (e) {}

    res.status(201).json({ id: applicationId, message: 'Loan application submitted successfully.' });
  } catch (err) {
    console.error('Error creating application:', err);
    res.status(500).json({ message: 'Failed to create application.' });
  }
});

// Get Application Details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    let sql = 'SELECT * FROM applications WHERE id = :id';
    const params = { id };

    // Non-admins can only view their own application details
    if ((req.user?.role || 'user').toLowerCase() !== 'admin') {
      sql += ' AND created_by = :userId';
      params.userId = req.user.id;
    }

    const [apps] = await pool.query(sql, params);
    if (!apps || apps.length === 0) {
      return res.status(404).json({ message: 'Application not found or unauthorized.' });
    }

    const application = apps[0];

    const [documents] = await pool.query('SELECT * FROM documents WHERE application_id = :id ORDER BY id ASC', { id });
    const [eligibilityRows] = await pool.query('SELECT * FROM eligibility WHERE application_id = :id ORDER BY id DESC LIMIT 1', { id });

    res.json({
      application,
      documents,
      eligibility: eligibilityRows.length > 0 ? eligibilityRows[0] : null,
    });
  } catch (err) {
    console.error('Error fetching application detail:', err);
    res.status(500).json({ message: 'Failed to fetch application details.' });
  }
});

// Approve / Reject Application Decision (Strictly Admin ONLY)
router.post('/:id/decision', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    let newStatus = 'pending';
    if (action === 'approve') newStatus = 'approved';
    if (action === 'reject') newStatus = 'rejected';

    if (action === 'approve' || action === 'reject') {
      await pool.query('UPDATE applications SET status = :newStatus WHERE id = :id', { newStatus, id });

      try {
        await pool.query(
          'INSERT INTO notifications (message) VALUES (:message)',
          { message: `Application #${id} was ${newStatus}.` }
        );
      } catch (e) {}
    } else if (action === 'request_document') {
      try {
        await pool.query(
          'INSERT INTO notifications (message) VALUES (:message)',
          { message: `Additional document requested for application #${id}.` }
        );
      } catch (e) {}
    }

    const [updated] = await pool.query('SELECT * FROM applications WHERE id = :id', { id });
    res.json({ message: `Application decision updated to ${action}.`, application: updated[0] });
  } catch (err) {
    console.error('Error updating application decision:', err);
    res.status(500).json({ message: 'Failed to record decision.' });
  }
});

// Delete Application (Admin or Application Owner)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = (req.user?.role || 'user').toLowerCase() === 'admin';

    const [apps] = await pool.query('SELECT * FROM applications WHERE id = :id', { id });
    if (!apps || apps.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (!isAdmin && apps[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this application.' });
    }

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
