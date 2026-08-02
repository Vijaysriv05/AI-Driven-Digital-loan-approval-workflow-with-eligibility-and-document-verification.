import { useEffect, useState } from 'react';
import { Users, Search, ShieldCheck, User as UserIcon } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import api from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || (u.role || 'user').toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <AppLayout title="Registered Users Directory (Admin)">
      <div className="card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
              <Users size={18} className="text-primary" /> User Accounts & Roles
            </h2>
            <p className="text-xs text-ink-400">View and manage all registered users, roles, and financial profiles.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user name or email"
                className="input-field pl-9 text-xs"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field text-xs sm:w-36"
            >
              <option value="">All Roles</option>
              <option value="user">User Role</option>
              <option value="admin">Admin Role</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="label-text border-b border-border">
                <th className="pb-2.5 font-medium">User ID</th>
                <th className="pb-2.5 font-medium">Name</th>
                <th className="pb-2.5 font-medium">Email</th>
                <th className="pb-2.5 font-medium">Role</th>
                <th className="pb-2.5 font-medium">Phone</th>
                <th className="pb-2.5 font-medium">Employment</th>
                <th className="pb-2.5 font-medium">Income</th>
                <th className="pb-2.5 font-medium">Credit Score</th>
                <th className="pb-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-card">
                  <td className="py-3 font-semibold text-ink-500">#{u.id}</td>
                  <td className="py-3 font-bold text-ink-900">{u.name}</td>
                  <td className="py-3 text-ink-600">{u.email}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-primary-50 text-primary-700 border border-primary-100'
                    }`}>
                      {u.role === 'admin' ? <ShieldCheck size={11} /> : <UserIcon size={11} />}
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="py-3 text-ink-600">{u.phone || '—'}</td>
                  <td className="py-3 text-ink-700">{u.employment_type || 'Salaried'}</td>
                  <td className="py-3 font-medium text-ink-900">
                    {u.monthly_income ? `₹${Number(u.monthly_income).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="py-3">
                    <span className="font-semibold text-emerald-700">{u.credit_score || '720'}</span>
                  </td>
                  <td className="py-3 text-ink-400">{new Date(u.created_at || Date.now()).toLocaleDateString()}</td>
                </tr>
              ))}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-ink-400">
                    No users match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
