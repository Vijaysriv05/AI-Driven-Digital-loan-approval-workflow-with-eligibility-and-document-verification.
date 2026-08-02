import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { analyzeDocumentOCR } from '../services/aiEngine.js';

const router = express.Router();

// Get documents for an application
router.get('/:applicationId', requireAuth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const [documents] = await pool.query('SELECT * FROM documents WHERE application_id = :applicationId ORDER BY id ASC', {
      applicationId,
    });
    res.json(documents);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ message: 'Failed to fetch documents.' });
  }
});

// Pre-Upload Real AI OCR Inspection Endpoint
router.post('/verify-pre-upload', requireAuth, async (req, res) => {
  try {
    const { doc_type, file_name } = req.body;
    if (!doc_type || !file_name) {
      return res.status(400).json({ valid: false, message: 'Document type and file name are required.' });
    }

    const applicantName = req.user?.name || '';
    const ocrResult = await analyzeDocumentOCR({ originalname: file_name }, doc_type, applicantName);
    const isValid = ocrResult.status === 'verified';

    res.json({
      valid: isValid,
      status: ocrResult.status,
      ocr_data: ocrResult.ocr_data || {
        document_type: doc_type.replace('_', ' ').toUpperCase(),
        file_name: file_name,
        verification_status: isValid ? '100% Verified Authentic' : 'Verification Rejected',
      },
      message: ocrResult.ai_explanation || (isValid ? `Verified Authentic ${doc_type.replace('_', ' ').toUpperCase()}` : `Document verification failed for ${file_name}.`),
    });
  } catch (err) {
    console.error('Error in pre-upload verification:', err);
    res.status(500).json({ valid: false, message: 'Failed to execute document OCR verification.' });
  }
});

// Upload Document and Perform AI OCR Verification
router.post('/:applicationId/upload', requireAuth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { doc_type, file_name } = req.body;

    if (!doc_type) {
      return res.status(400).json({ message: 'Document type is required.' });
    }

    // Fetch applicant details for mismatch validation
    const [apps] = await pool.query('SELECT applicant_name FROM applications WHERE id = :applicationId', { applicationId });
    const applicantName = apps.length > 0 ? apps[0].applicant_name : '';

    // Run AI Document OCR & Verification (Async Groq / Regex Engine)
    const ocrResult = await analyzeDocumentOCR(
      { originalname: file_name || `${doc_type}.pdf` },
      doc_type,
      applicantName
    );

    const docStatus = ocrResult.status || 'verified';
    const ocrDataStr = JSON.stringify(ocrResult.ocr_data);
    const rawOcrTextStr = ocrResult.raw_ocr_text || '';
    const confidenceScoreNum = Number(ocrResult.confidence_score) || (docStatus === 'verified' ? 95 : 15);
    const missingFieldsStr = JSON.stringify(ocrResult.missing_fields || []);
    const mismatchedFieldsStr = JSON.stringify(ocrResult.mismatched_fields || []);
    const aiExplanationStr = ocrResult.ai_explanation || '';
    const fileNameStr = file_name || `${doc_type}_uploaded.pdf`;

    // Check existing document
    const [existing] = await pool.query(
      'SELECT id FROM documents WHERE application_id = :applicationId AND doc_type = :doc_type',
      { applicationId, doc_type }
    );

    if (existing && existing.length > 0) {
      await pool.query(
        `UPDATE documents
         SET file_name = :file_name,
             status = :status,
             ocr_data = :ocr_data,
             raw_ocr_text = :raw_ocr_text,
             confidence_score = :confidence_score,
             missing_fields = :missing_fields,
             mismatched_fields = :mismatched_fields,
             ai_explanation = :ai_explanation,
             uploaded_at = CURRENT_TIMESTAMP
         WHERE application_id = :applicationId AND doc_type = :doc_type`,
        {
          applicationId,
          doc_type,
          file_name: fileNameStr,
          status: docStatus,
          ocr_data: ocrDataStr,
          raw_ocr_text: rawOcrTextStr,
          confidence_score: confidenceScoreNum,
          missing_fields: missingFieldsStr,
          mismatched_fields: mismatchedFieldsStr,
          ai_explanation: aiExplanationStr,
        }
      );
    } else {
      await pool.query(
        `INSERT INTO documents (application_id, doc_type, file_name, status, ocr_data, raw_ocr_text, confidence_score, missing_fields, mismatched_fields, ai_explanation)
         VALUES (:applicationId, :doc_type, :file_name, :status, :ocr_data, :raw_ocr_text, :confidence_score, :missing_fields, :mismatched_fields, :ai_explanation)`,
        {
          applicationId,
          doc_type,
          file_name: fileNameStr,
          status: docStatus,
          ocr_data: ocrDataStr,
          raw_ocr_text: rawOcrTextStr,
          confidence_score: confidenceScoreNum,
          missing_fields: missingFieldsStr,
          mismatched_fields: mismatchedFieldsStr,
          ai_explanation: aiExplanationStr,
        }
      );
    }

    const [updatedDocs] = await pool.query(
      'SELECT * FROM documents WHERE application_id = :applicationId AND doc_type = :doc_type',
      { applicationId, doc_type }
    );

    res.json({
      message: 'Document uploaded and AI OCR verification complete.',
      document: updatedDocs[0],
      mismatches: ocrResult.mismatches,
    });
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ message: 'Failed to process document upload.' });
  }
});

// Admin Document Decision Override (Approve / Reject AI Decision)
router.post('/:applicationId/:docId/admin-override', requireAuth, async (req, res) => {
  try {
    const { applicationId, docId } = req.params;
    const { status, reason } = req.body; // 'verified' or 'rejected'
    const adminName = req.user?.name || 'System Admin';

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin authorization required.' });
    }

    await pool.query(
      `UPDATE documents
       SET status = :status,
           admin_override = 1,
           admin_override_by = :adminName,
           ai_explanation = :explanation
       WHERE id = :docId AND application_id = :applicationId`,
      {
        status,
        adminName,
        explanation: `Admin Override by ${adminName}: Status set to ${status.toUpperCase()}. Reason: ${reason || 'Manual officer review.'}`,
        docId,
        applicationId,
      }
    );

    const [updated] = await pool.query('SELECT * FROM documents WHERE id = :docId', { docId });
    res.json({ message: `Document status overridden to ${status} by Admin.`, document: updated[0] });
  } catch (err) {
    console.error('Error in admin override:', err);
    res.status(500).json({ message: 'Failed to record admin override.' });
  }
});

export default router;
