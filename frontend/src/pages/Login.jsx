import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Landmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BankIllustration from '../components/BankIllustration';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('user@nimbuslending.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password, remember);
      if (loggedUser?.role === 'admin') {
        navigate(location.state?.from || '/admin/dashboard', { replace: true });
      } else {
        navigate(location.state?.from || '/user/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left: illustration */}
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

      {/* Right: form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Landmark size={18} strokeWidth={2.2} />
            </div>
            <span className="text-[15px] font-semibold text-ink-900">Nimbus Lending</span>
          </div>

          <h1 className="text-2xl font-semibold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to manage loan applications.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-danger">{error}</div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-500">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary-50"
                />
                Remember me
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-primary hover:text-primary-700">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
