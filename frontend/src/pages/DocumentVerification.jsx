import { useEffect, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Sparkles, Check, ShieldCheck, XCircle } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import api from '../api/client';

const docLabels = {
  aadhaar: 'Aadhaar Card (Govt ID)',
  pan: 'PAN Card (Govt ID)',
  house_document: 'House Property Title Deed (Home Loan)',
  bonafide: 'College Bonafide Certificate (Education Loan)',
  driving_license: 'Driving License / Vehicle Document (Vehicle Loan)',
  business_document: 'Business Registration / GST Certificate (Business Loan)',
  salary_slip: 'Salary Slip / Income Proof (Personal Loan)',
  bank_statement: 'Bank Statement',
};

export default function DocumentVerification() {
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyType, setBusyType] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.get('/applications').then(({ data }) => {
      setApplications(data);
      if (data.length > 0) setSelectedId(String(data[0].id));
    });
  }, []);

  const loadDocuments = (id) => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/documents/${id}`)
      .then(({ data }) => setDocuments(data))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments(selectedId);
  }, [selectedId]);

  const handleFileUpload = async (docType, e) => {
    const file = e?.target?.files?.[0];
    if (!file || !selectedId) return;

    setErrorMsg('');
    setBusyType(docType);
    try {
      const { data } = await api.post(`/documents/${selectedId}/upload`, {
        doc_type: docType,
        file_name: file.name,
      });

      if (data.document?.status === 'rejected') {
        setErrorMsg(`AI OCR Verification Rejected: ${file.name} failed verification for ${docLabels[docType]}.`);
      }
      loadDocuments(selectedId);
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload and verify document.');
    } finally {
      setBusyType('');
    }
  };

  const handleVerify = async (docId, docType) => {
    setBusyType(docType);
    try {
      await api.post(`/documents/${selectedId}/${docId}/verify`);
      loadDocuments(selectedId);
    } finally {
      setBusyType('');
    }
  };

  const docByType = (type) => documents.find((d) => d.doc_type === type);

  return (
    <AppLayout title="AI Document Verification & OCR Inspector">
      <div className="card mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" /> User Document Inspection & AI OCR Verification Panel
          </h2>
          <p className="text-xs text-ink-500">
            AI automatically performs 100% unbiased OCR inspection, validates authenticity, and displays explicit Accepted or Rejected verification status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink-600">Select Application:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="input-field sm:w-80"
          >
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} — {a.applicant_name} ({a.loan_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-xs font-medium text-danger border border-red-200 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-xs text-ink-400">Loading document verification records...</div>
      ) : documents.length === 0 ? (
        <div className="card p-12 text-center text-xs text-ink-400">
          No documents found for this application. Please upload documents in the application portal.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {documents.map((doc) => {
            const type = doc.doc_type;
            const status = (doc.status || '').toLowerCase();
            const isRejected = status === 'rejected' || status === 'failed';
            const isVerified = status === 'verified';

            const ocrFields = doc.ocr_data
              ? typeof doc.ocr_data === 'string'
                ? JSON.parse(doc.ocr_data)
                : doc.ocr_data
              : null;

            return (
              <div key={doc.id} className="card p-6 flex flex-col justify-between border border-border hover:border-primary-200 transition">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isVerified ? 'bg-emerald-50 text-emerald-600' : isRejected ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ink-900">{docLabels[type] || type.replace('_', ' ').toUpperCase()}</h3>
                        <p className="text-xs font-medium text-ink-500">{doc.file_name || 'No file uploaded'}</p>
                      </div>
                    </div>

                    {/* Prominent Verification Badge */}
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                        <CheckCircle2 size={14} className="text-emerald-600" /> ACCEPTED (AI Verified)
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 border border-red-300">
                        <XCircle size={14} className="text-red-600" /> REJECTED (Invalid / Mismatch)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                        <AlertCircle size={14} className="text-amber-600" /> PENDING UPLOAD
                      </span>
                    )}
                  </div>

                  {/* Verification Result Callout */}
                  {isVerified && (
                    <div className="mb-4 rounded-xl bg-emerald-50/80 p-3 text-xs text-emerald-900 border border-emerald-200 flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Document Accepted & Authenticated</span>
                        <p className="text-emerald-800 text-[11px]">
                          {doc.ai_explanation || 'AI OCR verified document format, structure, and applicant identity as original and authentic.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div className="mb-4 rounded-xl bg-red-50/80 p-3 text-xs text-red-900 border border-red-200 flex items-start gap-2">
                      <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Document Rejected by AI Inspection</span>
                        <p className="text-red-800 text-[11px]">
                          {doc.ai_explanation || 'The uploaded file failed authenticity or category inspection. Please upload a valid, matching document.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI OCR Extracted Box */}
                  {ocrFields ? (
                    <div className="mb-4 rounded-xl border border-border bg-card p-4">
                      <div className="mb-2.5 flex items-center justify-between border-b border-border pb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-primary" /> AI OCR Extracted Metadata
                        </span>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                          Verified Format
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 text-xs text-ink-700">
                        {Object.entries(ocrFields).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-border/40 py-1 last:border-0">
                            <span className="capitalize font-medium text-ink-500">{k.replace(/_/g, ' ')}</span>
                            <span className="font-semibold text-ink-900 text-right">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 rounded-xl border border-dashed border-border p-6 text-center text-xs text-ink-400">
                      No OCR data extracted yet. Re-upload file to trigger AI OCR inspection.
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <label className="btn-secondary flex-1 cursor-pointer justify-center text-xs">
                    <UploadCloud size={15} />
                    <span>{status === 'missing' ? 'Upload Document for AI Inspection' : 'Re-upload File for AI Re-verification'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(type, e)}
                      disabled={busyType === type || !selectedId}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
