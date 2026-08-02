import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, Clock, XCircle, Users, DollarSign, ShieldCheck, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AppLayout from '../../components/AppLayout';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/client';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics || {
    totalApplications: 0,
    approvedLoans: 0,
    pendingLoans: 0,
    rejectedLoans: 0,
    totalDisbursedAmount: 0,
    totalUsersCount: 0,
  };
  const trend = data?.trend || [];
  const pendingQueue = data?.pendingQueue || [];
  const recentUsers = data?.recentUsers || [];

  return (
    <AppLayout title="Admin AI Monitoring & Control Center">
      {/* Header Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 backdrop-blur-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Nimbus Lending Control Center (AI Monitoring Mode)</h2>
              <p className="text-xs text-indigo-200">
                AI automatically analyzes loan applications, evaluates stated loan reasons, and sends Explainable AI (XAI) responses to users. Admin page monitors operations, risk trends, and dynamic rules.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
            AI Automated System
          </span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Applications" value={metrics.totalApplications} icon={FileText} accent="primary" />
        <KpiCard label="Approved Loans" value={metrics.approvedLoans} icon={CheckCircle2} accent="success" />
        <KpiCard label="Pending Review" value={metrics.pendingLoans} icon={Clock} accent="warning" />
        <KpiCard label="Registered Users" value={metrics.totalUsersCount} icon={Users} accent="primary" />
      </div>

      {/* Disbursed Amount Card */}
      <div className="card mt-4 p-5 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-card">
        <div>
          <span className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">Total Approved Disbursal Value</span>
          <p className="text-3xl font-black mt-1">₹{Number(metrics.totalDisbursedAmount || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
          <DollarSign size={24} />
        </div>
      </div>

      {/* Loan Approval Trend Chart */}
      <div className="card mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">Loan Approvals & Rejection Trend</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E9EE" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E7E9EE', fontSize: 12 }} />
              <Line type="monotone" dataKey="approved" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="rejected" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Applications Queue & Recent Users Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Review Queue */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" /> Pending Review Queue
            </h3>
            <button onClick={() => navigate('/admin/applications')} className="text-xs font-medium text-primary hover:underline">
              View All Queue
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="label-text border-b border-border">
                  <th className="pb-2 font-medium">Applicant</th>
                  <th className="pb-2 font-medium">Loan Type</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingQueue.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium text-ink-900">{r.applicant_name}</td>
                    <td className="py-3 text-ink-700">{r.loan_type}</td>
                    <td className="py-3 text-ink-700">₹{Number(r.loan_amount).toLocaleString('en-IN')}</td>
                    <td className="py-3">
                      <button
                        onClick={() => navigate(`/applications/${r.id}`)}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        Review <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingQueue.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-ink-400">
                      No applications currently pending review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Directory */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
              <Users size={16} className="text-primary" /> Registered Users
            </h3>
            <button onClick={() => navigate('/admin/users')} className="text-xs font-medium text-primary hover:underline">
              User Directory
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="label-text border-b border-border">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium text-ink-900">{u.name}</td>
                    <td className="py-3 text-ink-600">{u.email}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-primary-50 text-primary-700'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
