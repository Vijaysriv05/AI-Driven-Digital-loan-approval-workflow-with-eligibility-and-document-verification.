import { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  const initials = (user?.name || 'A U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white/80 px-6 py-4 backdrop-blur-md">
      <h1 className="text-lg font-semibold text-ink-900">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-64 rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary-50"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-ink-500 transition hover:bg-card"
          >
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-white p-3 shadow-card">
              <p className="mb-2 text-xs font-medium text-ink-400">Notifications</p>
              <div className="flex flex-col gap-2 text-sm">
                <p className="text-ink-700">Application #A-1042 approved.</p>
                <p className="text-ink-700">New document uploaded for review.</p>
                <p className="text-ink-700">Eligibility check completed.</p>
              </div>
            </div>
          )}
        </div>

        <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-2 py-1.5 pr-3 transition hover:bg-card">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-xs font-semibold text-primary-700">
            {initials}
          </div>
          <span className="hidden text-sm font-medium text-ink-700 sm:block">
            {user?.name || 'Admin User'}
          </span>
          <ChevronDown size={14} className="text-ink-400" />
        </button>
      </div>
    </header>
  );
}
