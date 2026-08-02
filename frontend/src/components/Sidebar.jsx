import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  FileText,
  PlusCircle,
  FolderCheck,
  Gauge,
  Calculator,
  User as UserIcon,
  Users,
  Sliders,
  BarChart3,
  Percent,
  Settings as SettingsIcon,
  LogOut,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const userNavItems = [
  { to: '/user/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/user/apply', label: 'Apply for Loan', icon: PlusCircle },
  { to: '/user/applications', label: 'My Applications', icon: FileText },
  { to: '/user/documents', label: 'Document Upload', icon: FolderCheck },
  { to: '/user/eligibility', label: 'AI Eligibility & Risk', icon: Gauge },
  { to: '/user/emi-calculator', label: 'EMI Calculator', icon: Calculator },
  { to: '/user/profile', label: 'My Profile', icon: UserIcon },
];

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Executive Dashboard', icon: LayoutGrid },
  { to: '/admin/applications', label: 'All Applications', icon: FileText },
  { to: '/admin/users', label: 'User Directory', icon: Users },
  { to: '/admin/criteria', label: 'Dynamic Criteria', icon: Sliders },
  { to: '/admin/loan-products', label: 'Products & Rates', icon: Percent },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isAdmin = (user?.role || 'user').toLowerCase() === 'admin';
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col border-r border-border bg-white px-4 py-6">
      <div className="flex items-center gap-2 px-2 pb-6 border-b border-border mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
          <Landmark size={18} strokeWidth={2.2} />
        </div>
        <div>
          <span className="text-[15px] font-bold text-ink-900 block leading-tight">Nimbus Lending</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
            isAdmin ? 'text-indigo-600' : 'text-primary'
          }`}>
            {isAdmin ? <ShieldCheck size={11} /> : <UserIcon size={11} />}
            {user?.role || 'user'} Portal
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 border-t border-border mt-auto">
        <div className="mb-3 px-3 py-2 rounded-xl bg-card border border-border/60">
          <p className="text-xs font-semibold text-ink-900 truncate">{user?.name || 'User Account'}</p>
          <p className="text-[11px] text-ink-400 truncate">{user?.email}</p>
        </div>
        <button onClick={logout} className="sidebar-link w-full text-left text-red-600 hover:bg-red-50 hover:text-red-700">
          <LogOut size={18} strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  );
}
