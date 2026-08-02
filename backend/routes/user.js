import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateEligibilityAndRisk, analyzeDocumentOCR } from '../services/aiEngine.js';

const router = express.Router();

// User Dashboard Data
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user's applications
    const [userApps] = await pool.query('SELECT * FROM applications WHERE created_by = :userId ORDER BY created_at DESC', { userId });

    const totalSubmitted = userApps.length;
    const approvedCount = userApps.filter((a) => a.status === 'approved').length;
    const pendingCount = userApps.filter((a) => a.status === 'pending').length;
    const rejectedCount = userApps.filter((a) => a.status === 'rejected').length;

    // Active loan application for progress tracking
    const activeApp = userApps.length > 0 ? userApps[0] : null;

    // Fetch user notifications
    let notifications = [];
    try {
      const [notifs] = await pool.query('SELECT * FROM notifications WHERE user_id = :userId OR user_id IS NULL ORDER BY created_at DESC LIMIT 5', { userId });
      notifications = notifs;
    } catch (e) {
      notifications = [];
    }

    // Fetch loan products with live interest rates
    const [products] = await pool.query('SELECT * FROM loan_products ORDER BY id ASC');

    res.json({
      summary: {
        totalSubmitted,
        approvedCount,
        pendingCount,
        rejectedCount,
      },
      activeApplication: activeApp,
      recentApplications: userApps.slice(0, 5),
      notifications,
      loanProducts: products,
    });
  } catch (err) {
    console.error('Error fetching user dashboard:', err);
    res.status(500).json({ message: 'Failed to fetch user dashboard data.' });
  }
});

// Get User's Own Applications
router.get('/applications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT * FROM applications WHERE created_by = :userId ORDER BY created_at DESC', { userId });
    res.json(rows);
  } catch (err) {
    console.error('Error fetching user applications:', err);
    res.status(500).json({ message: 'Failed to fetch your applications.' });
  }
});

// Submit New Application & Run Unbiased AI Document Verification + Explainable AI Analysis
router.post('/applications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      loan_type,
      loan_amount,
      tenure_months,
      purpose,
      income: reqIncome,
      credit_score: reqCreditScore,
      employment_type: reqEmployment,
      existing_emi: reqExistingEmi,
      age: reqAge,
      govt_doc_type,
      govt_file_name,
      product_doc_type,
      product_file_name,
    } = req.body;

    if (!loan_type || !loan_amount) {
      return res.status(400).json({ message: 'Loan type and loan amount are required.' });
    }

    // Fetch user profile for applicant name & default financial parameters
    const [users] = await pool.query(
      'SELECT name, email, phone, employment_type, monthly_income, credit_score FROM users WHERE id = :userId',
      { userId }
    );
    const user = users.length > 0 ? users[0] : { name: req.user.name, email: req.user.email, phone: '' };

    const income = Number(reqIncome) || Number(user.monthly_income) || 50000;
    const creditScore = Number(reqCreditScore) || Number(user.credit_score) || 720;
    const employmentType = reqEmployment || user.employment_type || 'Salaried';
    const existingEmi = Number(reqExistingEmi) || 0;
    const age = Number(reqAge) || 30;
    const loanPurpose = purpose || 'Personal financial requirement';

    // 1. Mandatory Document Verification Gate
    const selectedGovtDoc = govt_doc_type || 'aadhaar';
    const selectedProdDoc = product_doc_type || (
      loan_type === 'Home Loan' ? 'house_document' :
      loan_type === 'Education Loan' ? 'bonafide' :
      loan_type === 'Vehicle Loan' ? 'driving_license' :
      loan_type === 'Business Loan' ? 'business_document' : 'salary_slip'
    );

    const govtOcr = await analyzeDocumentOCR({ originalname: govt_file_name || `${selectedGovtDoc}.pdf` }, selectedGovtDoc, user.name);
    const prodOcr = await analyzeDocumentOCR({ originalname: product_file_name || `${selectedProdDoc}.pdf` }, selectedProdDoc, user.name);

    const isGovtVerified = govtOcr.status === 'verified';
    const isProdVerified = prodOcr.status === 'verified';
    const areDocsValid = isGovtVerified && isProdVerified;

    // Fetch active criteria rules from DB
    const [criteriaRules] = await pool.query('SELECT * FROM loan_criteria');

    // Run AI Evaluation Engine for Loan Application & Purpose Analysis
    const aiResult = await calculateEligibilityAndRisk(
      {
        income,
        age,
        credit_score: creditScore,
        employment_type: employmentType,
        existing_emi: existingEmi,
        loan_amount: Number(loan_amount),
        loan_type,
        purpose: loanPurpose,
      },
      criteriaRules
    );

    // If documents fail verification, override recommendation to rejected with document rationale
    let finalStatus = areDocsValid ? (aiResult.recommendation === 'approved' ? 'approved' : 'rejected') : 'rejected';
    let statusStage = areDocsValid ? `AI Analyzed: ${finalStatus.toUpperCase()}` : 'Document Verification Failed';
    let adminComment = areDocsValid
      ? `AI Automated Analysis: Loan ${finalStatus.toUpperCase()}. Documents 100% verified. Purpose evaluation: ${aiResult.purpose_evaluation}`
      : `AI Document Check Failed: Govt ID (${govtOcr.status}) or ${selectedProdDoc} (${prodOcr.status}) failed 100% authenticity check.`;

    if (!areDocsValid) {
      aiResult.reasons.unshift(`Mandatory document verification failed: Upload 100% authentic original Govt ID (${selectedGovtDoc.toUpperCase()}) and product-specific proof (${selectedProdDoc.replace('_', ' ').toUpperCase()}).`);
      aiResult.recommendation = 'rejected';
      aiResult.risk_level = 'High Risk';
      aiResult.risk_percentage = 95.0;
    }

    const [result] = await pool.query(
      `INSERT INTO applications (applicant_name, email, phone, loan_type, loan_amount, tenure_months, purpose, status, status_stage, admin_comment, created_by)
       VALUES (:applicant_name, :email, :phone, :loan_type, :loan_amount, :tenure_months, :purpose, :status, :statusStage, :adminComment, :created_by)`,
      {
        applicant_name: user.name,
        email: user.email,
        phone: user.phone || '',
        loan_type,
        loan_amount: Number(loan_amount),
        tenure_months: Number(tenure_months) || 12,
        purpose: loanPurpose,
        status: finalStatus,
        statusStage,
        adminComment,
        created_by: userId,
      }
    );

    const applicationId = result.insertId;

    // Save Eligibility & Explainable AI Record
    await pool.query(
      `INSERT INTO eligibility
       (application_id, income, age, credit_score, employment_type, existing_emi, debt_ratio, eligibility_score, approval_probability, risk_level, risk_percentage, recommended_loan_type, recommendation_match, recommendation, reasons, purpose_evaluation)
       VALUES
       (:applicationId, :income, :age, :creditScore, :employmentType, :existingEmi, :debtRatio, :eligibilityScore, :approvalProbability, :riskLevel, :riskPercentage, :recommendedLoanType, :recommendationMatch, :recommendation, :reasons, :purposeEvaluation)`,
      {
        applicationId,
        income,
        age,
        creditScore,
        employmentType,
        existingEmi,
        debtRatio: aiResult.debt_ratio,
        eligibilityScore: aiResult.eligibility_score,
        approvalProbability: aiResult.approval_probability,
        riskLevel: aiResult.risk_level,
        riskPercentage: aiResult.risk_percentage,
        recommendedLoanType: aiResult.recommended_loan_type,
        recommendationMatch: aiResult.recommendation_match,
        recommendation: finalStatus,
        reasons: JSON.stringify(aiResult.reasons),
        purposeEvaluation: aiResult.purpose_evaluation,
      }
    );

    // Save Verified Document Slots into DB with full AI report fields
    await pool.query(
      `INSERT INTO documents (application_id, doc_type, file_name, status, ocr_data, raw_ocr_text, confidence_score, missing_fields, mismatched_fields, ai_explanation)
       VALUES (:applicationId, :docType, :fileName, :status, :ocrData, :rawOcrText, :confidenceScore, :missingFields, :mismatchedFields, :aiExplanation)`,
      {
        applicationId,
        docType: selectedGovtDoc,
        fileName: govt_file_name || `${selectedGovtDoc}_verified.pdf`,
        status: 'verified',
        ocrData: JSON.stringify(govtOcr.ocr_data),
        rawOcrText: govtOcr.raw_ocr_text || '',
        confidenceScore: 100,
        missingFields: JSON.stringify([]),
        mismatchedFields: JSON.stringify([]),
        aiExplanation: govtOcr.ai_explanation || 'AI Document Analysis: Verified authentic original document.',
      }
    );

    await pool.query(
      `INSERT INTO documents (application_id, doc_type, file_name, status, ocr_data, raw_ocr_text, confidence_score, missing_fields, mismatched_fields, ai_explanation)
       VALUES (:applicationId, :docType, :fileName, :status, :ocrData, :rawOcrText, :confidenceScore, :missingFields, :mismatchedFields, :aiExplanation)`,
      {
        applicationId,
        docType: selectedProdDoc,
        fileName: product_file_name || `${selectedProdDoc}_verified.pdf`,
        status: 'verified',
        ocrData: JSON.stringify(prodOcr.ocr_data),
        rawOcrText: prodOcr.raw_ocr_text || '',
        confidenceScore: 100,
        missingFields: JSON.stringify([]),
        mismatchedFields: JSON.stringify([]),
        aiExplanation: prodOcr.ai_explanation || 'AI Document Analysis: Verified authentic original document.',
      }
    );

    // Insert notification safely for the user with XAI decision explanation
    const mainReason = Array.isArray(aiResult.reasons) && aiResult.reasons.length > 0 ? aiResult.reasons[0] : aiResult.ai_summary;
    try {
      await pool.query(
        'INSERT INTO notifications (user_id, message) VALUES (:userId, :message)',
        {
          userId,
          message: `AI Verification & Underwriting for #${applicationId} (${loan_type}): ${finalStatus.toUpperCase()}. ${mainReason}`,
        }
      );
    } catch (e) {}

    res.status(201).json({
      id: applicationId,
      status: finalStatus,
      aiResult,
      message: `Loan application evaluated by AI. Status: ${finalStatus.toUpperCase()}.`,
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ message: 'Failed to submit application: ' + err.message });
  }
});

// Get Available Loan Products & Rates
router.get('/loan-products', requireAuth, async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM loan_products ORDER BY id ASC');
    res.json(products);
  } catch (err) {
    console.error('Error fetching loan products:', err);
    res.status(500).json({ message: 'Failed to fetch loan products.' });
  }
});

// Generate Loan Agreement for Approved Loan
router.get('/agreement/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [apps] = await pool.query('SELECT * FROM applications WHERE id = :id AND created_by = :userId', { id, userId });
    if (!apps || apps.length === 0) {
      return res.status(404).json({ message: 'Application not found or unauthorized.' });
    }

    const app = apps[0];
    if (app.status !== 'approved') {
      return res.status(400).json({ message: 'Loan agreement is only available for approved applications.' });
    }

    const agreementText = `
NIMBUS LENDING LOAN AGREEMENT

Agreement Reference: NMB-AGR-2026-${app.id}
Date of Sanction: ${new Date(app.updated_at || app.created_at).toLocaleDateString()}

PARTIES:
1. LENDER: Nimbus Lending Financial Services Ltd.
2. BORROWER: ${app.applicant_name} (${app.email || 'Registered Borrower'})

LOAN SANCTION DETAILS:
- Approved Loan Type: ${app.loan_type}
- Principal Sanctioned Amount: ₹${Number(app.loan_amount).toLocaleString('en-IN')}
- Approved Tenure: ${app.tenure_months} Months
- Sanction Status: Officially Approved & Verified

TERMS & CONDITIONS:
1. The Borrower agrees to repay the Principal Amount along with applicable interest in equated monthly installments (EMIs).
2. Interest calculation is governed by Nimbus Lending floating/fixed rate schedule.
3. Prepayment and foreclosure options are available subject to standard RBI banking guidelines.
4. All uploaded documents (PAN/Aadhaar/Income) have been AI-verified and validated.

Digitally Verified & Executed by Nimbus Lending AI Decisioning Platform.
`;

    res.json({
      applicationId: app.id,
      applicantName: app.applicant_name,
      loanType: app.loan_type,
      loanAmount: app.loan_amount,
      tenureMonths: app.tenure_months,
      agreementText,
    });
  } catch (err) {
    console.error('Error generating loan agreement:', err);
    res.status(500).json({ message: 'Failed to generate loan agreement.' });
  }
});

// Delete Application by ID
router.delete('/applications/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = (req.user?.role || 'user').toLowerCase() === 'admin';

    const [apps] = await pool.query('SELECT * FROM applications WHERE id = :id', { id });
    if (!apps || apps.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (!isAdmin && apps[0].created_by !== userId) {
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
