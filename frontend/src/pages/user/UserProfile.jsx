import { useEffect, useState } from 'react';
import { User, Phone, Mail, Briefcase, DollarSign, Award, CheckCircle2 } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function UserProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    employment_type: 'Salaried',
    monthly_income: '',
    credit_score: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/auth/profile')
      .then(({ data }) => {
        setForm({
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          employment_type: data.employment_type || 'Salaried',
          monthly_income: data.monthly_income || '75000',
          credit_score: data.credit_score || '740',
        });
      })
      .catch(() => {
        setForm((f) => ({
          ...f,
          name: user?.name || '',
          email: user?.email || '',
        }));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/auth/profile', form);
      setMessage('Personal and financial profile updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Borrower Profile Management">
      <div className="card max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
              <User size={18} className="text-primary" /> Personal & Financial Profile
            </h2>
            <p className="text-xs text-ink-400">
              Manage your personal details, contact info, employment, and income used by AI for loan evaluation.
            </p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary capitalize">
            Role: {user?.role || 'User'}
          </span>
        </div>

        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">Full Name</label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">Email Address</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  disabled
                  value={form.email}
                  className="input-field pl-9 bg-card cursor-not-allowed text-ink-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">Contact Phone</label>
              <div className="relative">
                <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="9876543210"
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">Employment Type</label>
              <div className="relative">
                <Briefcase size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <select
                  value={form.employment_type}
                  onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))}
                  className="input-field pl-9"
                >
                  <option>Salaried</option>
                  <option>Self-Employed</option>
                  <option>Business Owner</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">Monthly Net Income (₹)</label>
              <div className="relative">
                <DollarSign size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="number"
                  required
                  min={0}
                  value={form.monthly_income}
                  onChange={(e) => setForm((f) => ({ ...f, monthly_income: e.target.value }))}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">Credit Score (CIBIL)</label>
              <div className="relative">
                <Award size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="number"
                  required
                  min={300}
                  max={900}
                  value={form.credit_score}
                  onChange={(e) => setForm((f) => ({ ...f, credit_score: e.target.value }))}
                  className="input-field pl-9"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-border pt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Updating Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
