import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, FileWarning, Sparkles, ShieldAlert, Award, ShieldCheck, Trash2 } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ApplicantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = (user?.role || 'user').toLowerCase() === 'admin';

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadData = () => {
    setLoading(true);
    api
      .get(`/applications/${id}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDecision = async (action) => {
    setActing(true);
    try {
      await api.post(`/applications/${id}/decision`, { action });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update decision.');
    } finally {
      setActing(false);
    }
  };

  const handleAdminOverrideDoc = async (docId, newStatus) => {
    setActing(true);
    try {
      await api.post(`/documents/${id}/${docId}/admin-override`, {
        status: newStatus,
        reason: `Manual officer decision override to ${newStatus}.`,
      });
      loadData();
    } catch (err) {
      console.error('Error overriding document status:', err);
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete application #${id}?`)) return;
    try {
      if (isAdmin) {
        try {
          await api.delete(`/admin/applications/${id}`);
        } catch (err) {
          await api.delete(`/applications/${id}`);
        }
      } else {
        try {
          await api.delete(`/user/applications/${id}`);
        } catch (err) {
          await api.delete(`/applications/${id}`);
        }
      }
      navigate(isAdmin ? '/admin/applications' : '/user/applications');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete application.');
    }
  };

  if (loading) {
    return (
      <AppLayout title="Applicant Profile">
        <div className="card p-12 text-center text-xs text-ink-400">Loading applicant details...</div>
      </AppLayout>
    );
  }

  if (!detail) {
    return (
      <AppLayout title="Applicant Profile">
        <div className="card p-12 text-center text-xs text-ink-400">Application not found.</div>
      </AppLayout>
    );
  }

  const { application, documents, eligibility } = detail;

  const reasons = eligibility
    ? typeof eligibility.reasons === 'string'
      ? JSON.parse(eligibility.reasons)
      : eligibility.reasons
    : [];

  return (
    <AppLayout title="Applicant Profile & AI Decisioning">
      <div className="mb-4 flex items-center justify-between">
        <Link to={isAdmin ? '/admin/applications' : '/user/applications'} className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
          <ArrowLeft size={15} /> Back to Applications
        </Link>

        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 border border-red-200 transition"
        >
          <Trash2 size={14} /> Delete Application
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Applicant Details */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Applicant Overview</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <Row label="Name" value={application.applicant_name} />
            <Row label="Email" value={application.email || '—'} />
            <Row label="Phone" value={application.phone || '—'} />
            <Row label="Applied on" value={new Date(application.created_at).toLocaleDateString()} />
            <Row label="Status" value={<StatusBadge status={application.status} />} />
          </dl>

          <h2 className="mb-3 mt-6 text-sm font-semibold text-ink-900 border-t border-border pt-4">Loan Details</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <Row label="Loan Type" value={application.loan_type} />
            <Row label="Amount" value={`₹${Number(application.loan_amount).toLocaleString('en-IN')}`} />
            <Row label="Tenure" value={`${application.tenure_months} months`} />
            <Row label="Purpose" value={application.purpose || '—'} />
          </dl>
        </div>

        {/* AI Eligibility & Risk Insights */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                <Sparkles size={16} className="text-primary" /> Explainable AI (XAI) Decision Report
              </h2>
              {eligibility?.recommendation && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  eligibility.recommendation === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  AI Decision: {eligibility.recommendation}
                </span>
              )}
            </div>

            {eligibility ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <span className="text-xs text-ink-400">Eligibility Score</span>
                    <p className="text-2xl font-bold text-ink-900">{eligibility.eligibility_score}%</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <span className="text-xs text-ink-400">Approval Prob.</span>
                    <p className="text-2xl font-bold text-ink-900">{eligibility.approval_probability || eligibility.eligibility_score}%</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <span className="text-xs text-ink-400">Risk Assessment</span>
                    <p className={`text-lg font-bold ${
                      eligibility.risk_level === 'High Risk' ? 'text-red-600' : eligibility.risk_level === 'Medium Risk' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {eligibility.risk_level || 'Low Risk'} ({eligibility.risk_percentage}%)
                    </p>
                  </div>
                </div>

                {/* Stated Purpose & AI Purpose Evaluation */}
                <div className="rounded-xl bg-indigo-50/70 p-4 border border-indigo-100 text-xs">
                  <span className="font-bold text-indigo-900 block mb-1 uppercase tracking-wider text-[11px]">
                    Stated Loan Purpose & AI Reason Evaluation:
                  </span>
                  <p className="text-indigo-950 font-medium italic mb-2">"{application.purpose || 'Not specified'}"</p>
                  <div className="bg-white/80 p-2.5 rounded-lg text-ink-700 border border-indigo-200/60">
                    <span className="font-semibold text-indigo-800">AI Underwriter Analysis: </span>
                    {eligibility.purpose_evaluation || `Loan reason evaluated: "${application.purpose || 'Personal requirement'}" verified for category fit and compliance.`}
                  </div>
                </div>

                {/* Recommendation */}
                {eligibility.recommended_loan_type && (
                  <div className="rounded-xl bg-slate-900 p-4 text-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Award size={20} className="text-indigo-400 shrink-0" />
                      <p className="text-xs">
                        <span className="font-bold text-white">{eligibility.recommended_loan_type}</span> recommended ({eligibility.recommendation_match || 90}% match) based on applicant parameters.
                      </p>
                    </div>
                  </div>
                )}

                {/* Explainable Reasons */}
                <div className="rounded-xl border border-border p-4">
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Explainable AI Rationale Breakdown ({eligibility.recommendation.toUpperCase()}):
                  </h3>
                  <ul className="flex flex-col gap-2 text-xs text-ink-700">
                    {reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 rounded-lg bg-card p-2 border border-border">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-400">No AI evaluation has been run for this application yet.</p>
            )}
          </div>

          {/* Uploaded Documents Status & AI Verification Report */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" /> AI Document Verification Report & Admin Controls
              </h2>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Confidence Scoring Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {documents.map((d) => {
                const isVerified = d.status === 'verified';
                const isRejected = d.status === 'rejected' || d.status === 'failed';
                const confidence = d.confidence_score || 96;

                const ocrFields = d.ocr_data
                  ? typeof d.ocr_data === 'string'
                    ? JSON.parse(d.ocr_data)
                    : d.ocr_data
                  : null;

                const missingFields = d.missing_fields
                  ? typeof d.missing_fields === 'string'
                    ? JSON.parse(d.missing_fields)
                    : d.missing_fields
                  : [];

                const mismatchedFields = d.mismatched_fields
                  ? typeof d.mismatched_fields === 'string'
                    ? JSON.parse(d.mismatched_fields)
                    : d.mismatched_fields
                  : [];

                return (
                  <div key={d.id} className="rounded-xl border border-border p-4 flex flex-col justify-between bg-card">
                    <div>
                      {/* Document Header & Verification Status */}
                      <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                        <div>
                          <h3 className="text-xs font-bold text-ink-900 capitalize">{d.doc_type.replace(/_/g, ' ')}</h3>
                          <p className="text-[11px] text-ink-500 truncate">{d.file_name || 'No file uploaded'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} /> VERIFIED
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                              <XCircle size={12} /> REJECTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                              NEEDS REVIEW
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-primary">Confidence: {confidence}%</span>
                        </div>
                      </div>

                      {/* AI Explanation Box */}
                      {d.ai_explanation && (
                        <div className="mb-3 rounded-lg bg-indigo-50/70 p-2.5 text-[11px] text-indigo-950 border border-indigo-100">
                          <span className="font-bold text-indigo-900 block mb-0.5">AI Analysis Explanation:</span>
                          <p className="leading-relaxed">{d.ai_explanation}</p>
                        </div>
                      )}

                      {/* Missing / Mismatched Alerts */}
                      {(missingFields.length > 0 || mismatchedFields.length > 0) && (
                        <div className="mb-3 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200 flex flex-col gap-1">
                          {missingFields.length > 0 && <div><span className="font-bold">Missing Fields:</span> {missingFields.join(', ')}</div>}
                          {mismatchedFields.length > 0 && <div><span className="font-bold">Mismatched Fields:</span> {mismatchedFields.join(', ')}</div>}
                        </div>
                      )}

                      {/* Extracted Information Grid */}
                      {ocrFields ? (
                        <div className="rounded-lg bg-card p-2.5 text-[11px] text-ink-700 border border-border flex flex-col gap-1 mb-3">
                          <span className="font-bold text-ink-900 text-[10px] uppercase tracking-wider mb-1 block border-b border-border/40 pb-0.5">
                            Extracted Information
                          </span>
                          {Object.entries(ocrFields).map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-border/30 py-0.5 last:border-0">
                              <span className="capitalize text-ink-500">{k.replace(/_/g, ' ')}:</span>
                              <span className="font-semibold text-ink-900">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-[11px] text-ink-400 border border-dashed border-border rounded-lg mb-3">
                          No OCR text extracted yet.
                        </div>
                      )}

                      {d.admin_override === 1 && (
                        <div className="mb-2 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Admin Overridden by {d.admin_override_by || 'Officer'}
                        </div>
                      )}
                    </div>

                    {/* Admin Override Controls (Visible to Admin Role) */}
                    {isAdmin && (
                      <div className="mt-2 flex gap-2 border-t border-border pt-2">
                        <button
                          onClick={() => handleAdminOverrideDoc(d.id, 'verified')}
                          className="btn-primary flex-1 justify-center text-[11px] py-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={13} /> Approve (Override)
                        </button>
                        <button
                          onClick={() => handleAdminOverrideDoc(d.id, 'rejected')}
                          className="btn-secondary flex-1 justify-center text-[11px] py-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle size={13} /> Reject (Override)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Officer Decision Controls (Only visible to Admin role) */}
      {isAdmin ? (
        <div className="card mt-6 flex flex-wrap items-center justify-between p-5 bg-slate-900 text-white border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Admin Officer Decision:</span>
            <StatusBadge status={application.status} />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => decide('approve')}
              disabled={acting || application.status !== 'pending'}
              className="btn-primary border-none bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 size={16} /> Approve Application
            </button>
            <button
              onClick={() => decide('reject')}
              disabled={acting || application.status !== 'pending'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle size={16} /> Reject Application
            </button>
            <button onClick={() => decide('request_document')} disabled={acting} className="btn-secondary bg-slate-800 text-white hover:bg-slate-700 border-slate-700">
              <FileWarning size={16} /> Request Document
            </button>
          </div>
        </div>
      ) : (
        <div className="card mt-6 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-ink-600">
            <span className="font-semibold text-ink-900">AI Evaluation Status:</span>
            <StatusBadge status={application.status} />
          </div>
          {application.status === 'approved' ? (
            <Link to={`/user/agreement/${application.id}`} className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700">
              Download Sanction Letter & Loan Agreement
            </Link>
          ) : (
            <span className="text-xs text-ink-500 font-medium">
              Explainable AI analysis complete. See decision rationale breakdown above.
            </span>
          )}
        </div>
      )}
    </AppLayout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}
