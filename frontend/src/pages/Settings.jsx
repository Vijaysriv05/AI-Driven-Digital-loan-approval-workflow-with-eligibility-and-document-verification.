import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [theme, setTheme] = useState('light');
  const [saved, setSaved] = useState('');

  const handleSave = (section) => (e) => {
    e.preventDefault();
    setSaved(section);
    setTimeout(() => setSaved(''), 2000);
  };

  return (
    <AppLayout title="Settings">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form onSubmit={handleSave('profile')} className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Profile</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </div>
            <button type="submit" className="btn-primary self-start">
              {saved === 'profile' ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </form>

        <form onSubmit={handleSave('password')} className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Password</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary self-start">
              {saved === 'password' ? 'Updated' : 'Update password'}
            </button>
          </div>
        </form>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Notifications</h2>
          <div className="flex flex-col gap-3 text-sm">
            <ToggleRow label="Email alerts" checked={emailAlerts} onChange={setEmailAlerts} />
            <ToggleRow label="SMS alerts" checked={smsAlerts} onChange={setSmsAlerts} />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Theme</h2>
          <div className="flex gap-3">
            {['light', 'dark'].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition ${
                  theme === t ? 'border-primary bg-primary-50 text-primary-700' : 'border-border text-ink-500 hover:bg-card'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-400">Dark theme is coming soon.</p>
        </div>
      </div>
    </AppLayout>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-700">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-primary' : 'bg-border'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}
