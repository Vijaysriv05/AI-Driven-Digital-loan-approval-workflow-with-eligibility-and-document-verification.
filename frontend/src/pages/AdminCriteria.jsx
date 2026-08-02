import { useEffect, useState } from 'react';
import { Sliders, Save, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import api from '../api/client';

export default function AdminCriteria() {
  const [rules, setRules] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    min_income: '',
    min_credit_score: '',
    max_loan_amount: '',
    min_age: '',
    max_age: '',
    max_debt_ratio: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadRules = () => {
    setLoading(true);
    api
      .get('/admin/criteria')
      .then(({ data }) => {
        setRules(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(String(data[0].id));
          populateForm(data[0]);
        } else if (selectedId) {
          const active = data.find((r) => String(r.id) === String(selectedId));
          if (active) populateForm(active);
        }
      })
      .catch((err) => console.error('Failed to load rules:', err))
      .finally(() => setLoading(false));
  };

  const populateForm = (rule) => {
    setForm({
      min_income: rule.min_income,
      min_credit_score: rule.min_credit_score,
      max_loan_amount: rule.max_loan_amount,
      min_age: rule.min_age,
      max_age: rule.max_age,
      max_debt_ratio: rule.max_debt_ratio,
    });
  };

  useEffect(() => {
    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (idStr) => {
    setSelectedId(idStr);
    const selectedRule = rules.find((r) => String(r.id) === idStr);
    if (selectedRule) populateForm(selectedRule);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/admin/criteria/${selectedId}`, form);
      setMessage('Dynamic loan criteria updated! AI scoring engine updated in real time.');
      loadRules();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Failed to update rules.');
    } finally {
      setSaving(false);
    }
  };

  const activeRule = rules.find((r) => String(r.id) === String(selectedId));

  return (
    <AppLayout title="Dynamic Loan Criteria Management (Admin)">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 p-6 text-white shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300 backdrop-blur-md">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Rules Engine Configuration</h2>
            <p className="text-xs text-blue-200">
              Configure dynamic eligibility, risk prediction, and approval criteria thresholds evaluated in real-time by the AI engine.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Rule Selector Panel */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-900 flex items-center gap-2">
            <Sliders size={16} className="text-primary" /> Loan Product Rules
          </h3>
          <div className="flex flex-col gap-2">
            {rules.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(String(r.id))}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  String(r.id) === String(selectedId)
                    ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-soft'
                    : 'bg-card text-ink-700 hover:bg-ink-50 border border-transparent'
                }`}
              >
                <span>{r.loan_type}</span>
                <span className="text-xs text-ink-400">Min. ₹{Number(r.min_income).toLocaleString('en-IN')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rule Editor Form */}
        <div className="card p-6 lg:col-span-2">
          {activeRule ? (
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-semibold text-ink-900">{activeRule.loan_type} Thresholds</h3>
                  <p className="text-xs text-ink-500">
                    Changes take effect immediately for all pending and new applicant AI checks.
                  </p>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary">
                  ID: #{activeRule.id}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Minimum Monthly Income (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.min_income}
                    onChange={(e) => setForm((f) => ({ ...f, min_income: e.target.value }))}
                    className="input-field"
                  />
                  <span className="mt-1 block text-xs text-ink-400">Applicants below this income get lower approval odds.</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Minimum Credit Score
                  </label>
                  <input
                    type="number"
                    required
                    min={300}
                    max={900}
                    value={form.min_credit_score}
                    onChange={(e) => setForm((f) => ({ ...f, min_credit_score: e.target.value }))}
                    className="input-field"
                  />
                  <span className="mt-1 block text-xs text-ink-400">Standard CIBIL/Experian score threshold (300-900).</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Maximum Loan Amount Cap (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.max_loan_amount}
                    onChange={(e) => setForm((f) => ({ ...f, max_loan_amount: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Max Debt-to-Income / EMI Limit (%)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={form.max_debt_ratio}
                    onChange={(e) => setForm((f) => ({ ...f, max_debt_ratio: e.target.value }))}
                    className="input-field"
                  />
                  <span className="mt-1 block text-xs text-ink-400">Max allowable ratio of total monthly EMIs to income.</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Minimum Age Limit (Years)
                  </label>
                  <input
                    type="number"
                    required
                    min={18}
                    max={100}
                    value={form.min_age}
                    onChange={(e) => setForm((f) => ({ ...f, min_age: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Maximum Age Limit (Years)
                  </label>
                  <input
                    type="number"
                    required
                    min={18}
                    max={100}
                    value={form.max_age}
                    onChange={(e) => setForm((f) => ({ ...f, max_age: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">
                  <ShieldAlert size={15} className="shrink-0" />
                  <span>Rule changes will automatically update AI explainable decision outputs.</span>
                </div>
                <button type="submit" disabled={saving} className="btn-primary">
                  <Save size={16} />
                  {saving ? 'Updating Rules...' : 'Save Rule Changes'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-ink-400">Select a loan product rule to edit.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
