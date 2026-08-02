import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import api from '../api/client';

const loanTypes = ['Personal Loan', 'Home Loan', 'Vehicle Loan', 'Education Loan', 'Business Loan'];

export default function NewApplication() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    applicant_name: '',
    email: '',
    phone: '',
    loan_type: loanTypes[0],
    loan_amount: '',
    tenure_months: 12,
    purpose: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/applications', form);
      navigate(`/applications/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create application.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="New Application">
      <Link to="/applications" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft size={15} /> Back to Applications
      </Link>

      <form onSubmit={handleSubmit} className="card max-w-2xl p-6">
        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-danger">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Applicant name</label>
            <input required value={form.applicant_name} onChange={update('applicant_name')} className="input-field" placeholder="Full name" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
            <input type="email" value={form.email} onChange={update('email')} className="input-field" placeholder="name@example.com" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Phone</label>
            <input value={form.phone} onChange={update('phone')} className="input-field" placeholder="9876543210" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Loan type</label>
            <select value={form.loan_type} onChange={update('loan_type')} className="input-field">
              {loanTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Tenure (months)</label>
            <input type="number" min={1} value={form.tenure_months} onChange={update('tenure_months')} className="input-field" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Loan amount (₹)</label>
            <input type="number" min={0} required value={form.loan_amount} onChange={update('loan_amount')} className="input-field" placeholder="250000" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Purpose</label>
            <input value={form.purpose} onChange={update('purpose')} className="input-field" placeholder="e.g. Home renovation" />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Creating...' : 'Create Application'}
          </button>
          <button type="button" onClick={() => navigate('/applications')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
