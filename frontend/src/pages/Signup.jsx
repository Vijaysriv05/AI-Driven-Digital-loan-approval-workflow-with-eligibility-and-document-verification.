import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Landmark, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BankIllustration from '../components/BankIllustration';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await signup(form);
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-1/2 items-center justify-center bg-primary-50 lg:flex">
        <div className="absolute left-10 top-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <Landmark size={18} strokeWidth={2.2} />
          </div>
          <span className="text-[15px] font-semibold text-ink-900">Nimbus Lending</span>
        </div>
        <div className="w-full max-w-md px-10">
          <BankIllustration />
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-ink-900">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">Select role and set up access to Nimbus Lending.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-danger">{error}</div>
            )}

            {/* Role Selection Toggle */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Register Account As</label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-card p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: 'user' }))}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                    form.role === 'user'
                      ? 'bg-white text-primary shadow-soft border border-border'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  <UserIcon size={14} /> User (Borrower)
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: 'admin' }))}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                    form.role === 'admin'
                      ? 'bg-white text-primary shadow-soft border border-border'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  <ShieldCheck size={14} /> Admin Officer
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Full name</label>
              <div className="relative">
                <UserIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  required
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Jane Doe"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@company.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
              {loading ? 'Creating account...' : `Register as ${form.role === 'admin' ? 'Admin' : 'User'}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-700">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
