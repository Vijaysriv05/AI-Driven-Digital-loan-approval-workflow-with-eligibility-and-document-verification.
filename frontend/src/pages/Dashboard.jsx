import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, Clock, XCircle, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AppLayout from '../components/AppLayout';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import api from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/summary')
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis || { applications: 0, approved: 0, pending: 0, rejected: 0 };
  const trend = data?.trend || [];
  const recent = data?.recentApplications || [];
  const notifications = data?.notifications || [];

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Applications" value={kpis.applications} icon={FileText} accent="primary" />
        <KpiCard label="Approved" value={kpis.approved} icon={CheckCircle2} accent="success" />
        <KpiCard label="Pending" value={kpis.pending} icon={Clock} accent="warning" />
        <KpiCard label="Rejected" value={kpis.rejected} icon={XCircle} accent="danger" />
      </div>

      <div className="card mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Loan Approval Trend</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E9EE" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E7E9EE', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="approved"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563EB' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Recent Applications</h2>
          <button onClick={() => navigate('/applications')} className="text-sm font-medium text-primary hover:text-primary-700">
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="label-text border-b border-border">
                <th className="pb-2 pr-4 font-medium">Applicant</th>
                <th className="pb-2 pr-4 font-medium">Loan Amount</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium text-ink-900">{r.applicant_name}</td>
                  <td className="py-3 pr-4 text-ink-700">₹{Number(r.loan_amount).toLocaleString('en-IN')}</td>
                  <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 pr-4 text-ink-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <button
                      onClick={() => navigate(`/applications/${r.id}`)}
                      className="text-sm font-medium text-primary hover:text-primary-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-ink-400">
                    No applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">Recent Notifications</h2>
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <Bell size={14} />
              </div>
              <div>
                <p className="text-sm text-ink-700">{n.message}</p>
                <p className="text-xs text-ink-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {!loading && notifications.length === 0 && (
            <p className="text-sm text-ink-400">No notifications yet.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
