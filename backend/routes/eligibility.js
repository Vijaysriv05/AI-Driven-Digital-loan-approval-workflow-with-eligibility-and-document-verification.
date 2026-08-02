import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateEligibilityAndRisk } from '../services/aiEngine.js';

const router = express.Router();

// Get stored eligibility result for an application
router.get('/:applicationId', requireAuth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const [rows] = await pool.query('SELECT * FROM eligibility WHERE application_id = :applicationId ORDER BY id DESC LIMIT 1', {
      applicationId,
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'No eligibility evaluation found for this application.' });
    }

    const item = rows[0];
    res.json(item);
  } catch (err) {
    console.error('Error fetching eligibility:', err);
    res.status(500).json({ message: 'Failed to fetch eligibility metrics.' });
  }
});

// Run AI Eligibility & Risk Check for an Application using Dynamic Rules and Groq LLM
router.post('/:applicationId/evaluate', requireAuth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { income, age, credit_score, employment_type, existing_emi } = req.body;

    // Fetch loan application details
    const [apps] = await pool.query('SELECT * FROM applications WHERE id = :applicationId', { applicationId });
    if (!apps || apps.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    const app = apps[0];

    // Fetch current dynamic rules from DB
    const [criteriaRules] = await pool.query('SELECT * FROM loan_criteria');

    // Run Groq AI Calculation Engine
    const result = await calculateEligibilityAndRisk(
      {
        income,
        age: age || 30,
        credit_score,
        employment_type,
        existing_emi: existing_emi || 0,
        loan_amount: app.loan_amount,
        loan_type: app.loan_type,
        purpose: app.purpose || 'Personal financial requirement',
      },
      criteriaRules
    );

    // Save or update eligibility table
    const [existing] = await pool.query('SELECT id FROM eligibility WHERE application_id = :applicationId', { applicationId });

    if (existing && existing.length > 0) {
      await pool.query(
        `UPDATE eligibility
         SET income = :income,
             age = :age,
             credit_score = :credit_score,
             employment_type = :employment_type,
             existing_emi = :existing_emi,
             debt_ratio = :debt_ratio,
             eligibility_score = :eligibility_score,
             approval_probability = :approval_probability,
             risk_level = :risk_level,
             risk_percentage = :risk_percentage,
             recommended_loan_type = :recommended_loan_type,
             recommendation_match = :recommendation_match,
             recommendation = :recommendation,
             reasons = :reasons,
             purpose_evaluation = :purpose_evaluation
         WHERE application_id = :applicationId`,
        {
          applicationId,
          income,
          age: age || 30,
          credit_score,
          employment_type,
          existing_emi: existing_emi || 0,
          debt_ratio: result.debt_ratio,
          eligibility_score: result.eligibility_score,
          approval_probability: result.approval_probability,
          risk_level: result.risk_level,
          risk_percentage: result.risk_percentage,
          recommended_loan_type: result.recommended_loan_type,
          recommendation_match: result.recommendation_match,
          recommendation: result.recommendation,
          reasons: JSON.stringify(result.reasons),
          purpose_evaluation: result.purpose_evaluation,
        }
      );
    } else {
      await pool.query(
        `INSERT INTO eligibility
         (application_id, income, age, credit_score, employment_type, existing_emi, debt_ratio, eligibility_score, approval_probability, risk_level, risk_percentage, recommended_loan_type, recommendation_match, recommendation, reasons, purpose_evaluation)
         VALUES
         (:applicationId, :income, :age, :credit_score, :employment_type, :existing_emi, :debt_ratio, :eligibility_score, :approval_probability, :risk_level, :risk_percentage, :recommended_loan_type, :recommendation_match, :recommendation, :reasons, :purpose_evaluation)`,
        {
          applicationId,
          income,
          age: age || 30,
          credit_score,
          employment_type,
          existing_emi: existing_emi || 0,
          debt_ratio: result.debt_ratio,
          eligibility_score: result.eligibility_score,
          approval_probability: result.approval_probability,
          risk_level: result.risk_level,
          risk_percentage: result.risk_percentage,
          recommended_loan_type: result.recommended_loan_type,
          recommendation_match: result.recommendation_match,
          recommendation: result.recommendation,
          reasons: JSON.stringify(result.reasons),
          purpose_evaluation: result.purpose_evaluation,
        }
      );
    }

    // Sync application status to AI recommendation
    const newStatus = result.recommendation === 'approved' ? 'approved' : 'rejected';
    await pool.query(
      `UPDATE applications
       SET status = :newStatus,
           status_stage = :stage,
           admin_comment = :comment
       WHERE id = :applicationId`,
      {
        applicationId,
        newStatus,
        stage: `AI Analyzed: ${newStatus.toUpperCase()}`,
        comment: `AI Evaluation: ${result.ai_summary}`,
      }
    );

    // Notify user
    if (app.created_by) {
      try {
        await pool.query(
          'INSERT INTO notifications (user_id, message) VALUES (:userId, :message)',
          {
            userId: app.created_by,
            message: `AI Evaluation updated for Application #${applicationId}: Decision is ${newStatus.toUpperCase()}.`,
          }
        );
      } catch (e) {}
    }

    res.json(result);
  } catch (err) {
    console.error('Error evaluating eligibility:', err);
    res.status(500).json({ message: 'Failed to execute eligibility assessment.' });
  }
});

export default router;
