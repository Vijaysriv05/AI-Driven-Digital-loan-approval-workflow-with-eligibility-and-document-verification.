import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Sparkles, Award } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import api from '../api/client';

function ScoreRing({ score, riskLevel }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = '#059669'; // Green
  if (score < 60) strokeColor = '#DC2626'; // Red
  else if (score < 75) strokeColor = '#D97706'; // Amber

  return (
    <div className="relative mx-auto flex flex-col items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#E7E9EE" strokeWidth="14" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="90" y="84" textAnchor="middle" fontSize="32" fontWeight="700" fill="#101828">
          {score}%
        </text>
        <text x="90" y="106" textAnchor="middle" fontSize="12" fontWeight="500" fill="#667085">
          AI Score
        </text>
      </svg>
    </div>
  );
}

export default function Eligibility() {
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [form, setForm] = useState({
    income: '',
    age: '30',
    credit_score: '',
    employment_type: 'Salaried',
    existing_emi: '',
    loan_amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    api.get('/applications').then(({ data }) => {
      setApplications(data);
      if (data.length > 0) {
        setSelectedId(String(data[0].id));
        setForm((f) => ({
          ...f,
          loan_amount: data[0].loan_amount || '',
        }));
      }
    });
  }, []);

  const loadEligibility = (id) => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/eligibility/${id}`)
      .then(({ data }) => {
        setEligibility(data);
        if (data) {
          setForm({
            income: data.income || '',
            age: data.age || '30',
            credit_score: data.credit_score || '',
            employment_type: data.employment_type || 'Salaried',
            existing_emi: data.existing_emi || '',
            loan_amount: data.loan_amount || '',
          });
        }
      })
      .catch(() => setEligibility(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEligibility(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setEvaluating(true);
    try {
      const { data } = await api.post(`/eligibility/${selectedId}/evaluate`, form);
      setEligibility(data);
    } catch (err) {
      console.error('Error running AI evaluation:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const reasons = eligibility
    ? typeof eligibility.reasons === 'string'
      ? JSON.parse(eligibility.reasons)
      : eligibility.reasons
    : [];

  return (
    <AppLayout title="AI Loan Eligibility & Risk Engine">
      <div className="card mb-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">Select Applicant</h2>
          <p className="text-xs text-ink-400">Evaluate application against live dynamic loan rules.</p>
        </div>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            const app = applications.find((a) => String(a.id) === e.target.value);
            if (app) setForm((f) => ({ ...f, loan_amount: app.loan_amount }));
          }}
          className="input-field sm:w-80"
        >
          {applications.map((a) => (
            <option key={a.id} value={a.id}>
              {a.applicant_name} — #{a.id} ({a.loan_type})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Form */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink-900 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Run AI Eligibility Check
          </h3>
          <form onSubmit={handleEvaluate} className="flex flex-col gap-3 text-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">Monthly Income (₹)</label>
              <input
                type="number"
                required
                min={0}
                placeholder="e.g. 75000"
                value={form.income}
                onChange={(e) => setForm((f) => ({ ...f, income: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">Applicant Age (Years)</label>
              <input
                type="number"
                required
                min={18}
                max={100}
                placeholder="e.g. 32"
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-700">Credit Score</label>
                <input
                  type="number"
                  required
                  min={300}
                  max={900}
                  placeholder="e.g. 740"
                  value={form.credit_score}
                  onChange={(e) => setForm((f) => ({ ...f, credit_score: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-700">Employment</label>
                <select
                  value={form.employment_type}
                  onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))}
                  className="input-field"
                >
                  <option>Salaried</option>
                  <option>Self-Employed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">Existing Monthly EMI (₹)</label>
              <input
                type="number"
                placeholder="e.g. 8000"
                value={form.existing_emi}
                onChange={(e) => setForm((f) => ({ ...f, existing_emi: e.target.value }))}
                className="input-field"
              />
            </div>

            <button type="submit" disabled={evaluating || !selectedId} className="btn-primary mt-2">
              {evaluating ? 'Analyzing Profile...' : 'Run AI Evaluation'}
            </button>
          </form>
        </div>

        {/* Right Column: AI Outputs */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {eligibility ? (
            <>
              {/* Score & Risk Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* AI Score Card */}
                <div className="card p-6 flex flex-col items-center justify-center text-center">
                  <ScoreRing score={eligibility.eligibility_score || 0} riskLevel={eligibility.risk_level} />
                  <div className="mt-3">
                    <span className="text-xs text-ink-400 font-medium">Approval Probability</span>
                    <p className="text-xl font-bold text-ink-900">{eligibility.approval_probability || eligibility.eligibility_score}%</p>
                  </div>
                </div>

                {/* Risk Prediction Card */}
                <div className="card p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">AI Risk Prediction</span>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {eligibility.risk_level === 'High Risk' ? (
                          <AlertTriangle size={24} className="text-danger" />
                        ) : eligibility.risk_level === 'Medium Risk' ? (
                          <AlertTriangle size={24} className="text-amber-500" />
                        ) : (
                          <ShieldCheck size={24} className="text-emerald-600" />
                        )}
                        <span className="text-lg font-bold text-ink-900">{eligibility.risk_level || 'Low Risk'}</span>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        eligibility.risk_level === 'High Risk'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : eligibility.risk_level === 'Medium Risk'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {eligibility.risk_percentage}% Default Risk
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-xs">
                    <Metric label="Income" value={eligibility.income ? `₹${Number(eligibility.income).toLocaleString('en-IN')}` : '—'} />
                    <Metric label="Credit Score" value={eligibility.credit_score || '—'} />
                    <Metric label="Debt Ratio (DTI)" value={eligibility.debt_ratio != null ? `${eligibility.debt_ratio}%` : '—'} />
                  </div>
                </div>
              </div>

              {/* AI Loan Recommendation Card */}
              {eligibility.recommended_loan_type && (
                <div className="card p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                      <Award size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">AI Product Recommendation</span>
                        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                          {eligibility.recommendation_match || 90}% Match
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        <span className="font-bold text-white">{eligibility.recommended_loan_type}</span> recommended based on income stability and applicant profile match.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stated Purpose & AI Purpose Evaluation */}
              {eligibility.purpose_evaluation && (
                <div className="card p-4 bg-indigo-50/70 border border-indigo-100 text-xs">
                  <span className="font-bold text-indigo-900 block mb-1 uppercase tracking-wider text-[11px]">
                    AI Stated Loan Purpose Analysis:
                  </span>
                  <p className="text-indigo-950 font-medium">{eligibility.purpose_evaluation}</p>
                </div>
              )}

              {/* AI Explainable Loan Decision Reasons Card */}
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    {eligibility.recommendation === 'approved' ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <XCircle size={20} className="text-red-600" />
                    )}
                    <h3 className="text-base font-semibold capitalize text-ink-900">
                      AI Explainable Decision: {eligibility.recommendation}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    XAI Evaluated
                  </span>
                </div>

                <p className="mb-3 text-xs font-medium text-ink-400 uppercase tracking-wider">Decision Factors & Rationale:</p>
                <ul className="flex flex-col gap-2.5 text-sm text-ink-700">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-lg bg-card p-2.5 border border-border">
                      <span className="mt-0.5 flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center text-ink-400">
              <Sparkles size={32} className="mx-auto mb-3 text-ink-300" />
              <p className="text-sm">Click "Run AI Evaluation" to calculate loan eligibility, risk level, explainable reasons, and recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}
