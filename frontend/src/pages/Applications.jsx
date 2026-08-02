import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Applications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = (user?.role || 'user').toLowerCase() === 'admin';

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    // GET /applications automatically scopes to req.user.id for non-admin users
    api
      .get('/applications', { params: { search, status } })
      .then(({ data }) => setRows(data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete application #${id}?`)) return;
    try {
      if (isAdmin) {
        try {
          await api.delete(`/admin/applications/${id}`);
        } catch (err) {
          await api.delete(`/applications/${id}`);
        }
      } else {
        try {
          await api.delete(`/user/applications/${id}`);
        } catch (err) {
          await api.delete(`/applications/${id}`);
        }
      }
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete application.');
    }
  };

  return (
    <AppLayout title={isAdmin ? 'AI Loan Applications Audit (Admin Monitoring)' : 'My Loan Applications'}>
      {/* Explainable AI Banner */}
      <div className="mb-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 p-4 text-white flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
            {isAdmin ? 'Admin AI Monitoring Center' : 'Explainable AI Decision Engine'}
          </span>
          <p className="text-xs text-slate-200 mt-0.5">
            {isAdmin
              ? 'Monitoring autonomous AI loan evaluations, applicant stated reasons, risk levels, and explainable decision logs.'
              : 'Every loan application is evaluated by Explainable AI based on your stated loan purpose and financial parameters. Click any row to view full XAI reasons.'}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
          XAI Active
        </span>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAdmin ? 'Search applicant or email' : 'Search loan type or purpose'}
                className="input-field pl-9 text-xs"
              />
            </div>
            <div className="relative sm:w-48">
              <SlidersHorizontal size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field appearance-none pl-9 text-xs"
              >
                <option value="">All statuses</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          {!isAdmin && (
            <button onClick={() => navigate('/user/apply')} className="btn-primary shrink-0 text-xs">
              <Plus size={16} />
              Apply for New Loan
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="label-text border-b border-border">
                <th className="pb-2.5 font-medium">ID</th>
                <th className="pb-2.5 font-medium">Applicant</th>
                <th className="pb-2.5 font-medium">Loan Type</th>
                <th className="pb-2.5 font-medium">Amount</th>
                <th className="pb-2.5 font-medium">Stated Purpose / Reason</th>
                <th className="pb-2.5 font-medium">AI Decision & Stage</th>
                <th className="pb-2.5 font-medium">Date</th>
                <th className="pb-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/applications/${r.id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-card transition"
                >
                  <td className="py-3 font-semibold text-ink-500">#{r.id}</td>
                  <td className="py-3 font-bold text-ink-900">{r.applicant_name}</td>
                  <td className="py-3 text-ink-700">{r.loan_type}</td>
                  <td className="py-3 text-ink-900 font-semibold">₹{Number(r.loan_amount).toLocaleString('en-IN')}</td>
                  <td className="py-3 text-ink-600 max-w-xs truncate">{r.purpose || '—'}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={r.status} />
                      <span className="text-[10px] text-ink-400 font-medium">{r.status_stage || 'AI Evaluated'}</span>
                    </div>
                  </td>
                  <td className="py-3 text-ink-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={(e) => handleDelete(e, r.id)}
                      className="inline-flex items-center gap-1 rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                      title="Delete Application"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-ink-400">
                    {isAdmin ? 'No applications match criteria.' : 'You have not submitted any loan applications yet.'}
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
