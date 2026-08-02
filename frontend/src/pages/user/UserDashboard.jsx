import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, CheckCircle2, Clock, XCircle, Bell, ArrowRight, ShieldCheck, Calculator, Sparkles } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/client';

const statusStages = ['Submitted', 'Document Verification', 'Under Review', 'Decision'];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/user/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || { totalSubmitted: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
  const activeApp = data?.activeApplication;
  const recentApps = data?.recentApplications || [];
  const notifications = data?.notifications || [];
  const products = data?.loanProducts || [];

  const getStageIndex = (stage, status) => {
    if (status === 'approved' || status === 'rejected') return 3;
    if (stage === 'Under Review') return 2;
    if (stage === 'Document Verification') return 1;
    return 0;
  };

  return (
    <AppLayout title="Borrower Portal Dashboard">
      {/* Welcome Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-primary-700 p-6 text-white shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Welcome to Nimbus Lending</h2>
            <p className="mt-1 text-xs text-primary-100">
              Apply for instant loans, track status stages, upload documents, and calculate monthly EMIs.
            </p>
          </div>
          <button onClick={() => navigate('/user/apply')} className="btn-secondary self-start border-none bg-white text-primary hover:bg-primary-50">
            <PlusCircle size={16} /> Apply for New Loan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="My Applications" value={summary.totalSubmitted} icon={FileText} accent="primary" />
        <KpiCard label="Approved Loans" value={summary.approvedCount} icon={CheckCircle2} accent="success" />
        <KpiCard label="Pending Review" value={summary.pendingCount} icon={Clock} accent="warning" />
        <KpiCard label="Rejected" value={summary.rejectedCount} icon={XCircle} accent="danger" />
      </div>

      {/* Active Loan Progress Tracker Bar */}
      {activeApp && (
        <div className="card mt-6 p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Latest Loan Progress Tracker</span>
              <h3 className="text-base font-bold text-ink-900">
                {activeApp.loan_type} — ₹{Number(activeApp.loan_amount).toLocaleString('en-IN')} (Ref #{activeApp.id})
              </h3>
            </div>
            <StatusBadge status={activeApp.status} />
          </div>

          {/* Progress Stage Tracker */}
          <div className="mt-6 border-t border-border pt-6">
            <div className="relative flex items-center justify-between">
              {statusStages.map((stageName, idx) => {
                const currentIdx = getStageIndex(activeApp.status_stage, activeApp.status);
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={stageName} className="relative flex flex-1 flex-col items-center text-center">
                    <div
                      className={`z-10 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${
                        isPassed
                          ? activeApp.status === 'rejected' && idx === 3
                            ? 'bg-danger text-white'
                            : 'bg-primary text-white shadow-soft'
                          : 'bg-card text-ink-400 border border-border'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-primary font-bold' : 'text-ink-500'}`}>
                      {stageName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loan Products Grid */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Available Loan Products & Rates
          </h3>
          <button onClick={() => navigate('/user/emi-calculator')} className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
            <Calculator size={14} /> Open EMI Calculator
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card p-5 flex flex-col justify-between hover:border-primary-200 transition">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-ink-900">{p.name}</h4>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    {p.interest_rate}% p.a.
                  </span>
                </div>
                <p className="text-xs text-ink-500 mb-4 line-clamp-2">{p.description}</p>

                <div className="flex flex-col gap-1 text-xs text-ink-700 border-t border-border pt-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-ink-400">Max Amount:</span>
                    <span className="font-semibold">Up to ₹{Number(p.max_amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">Tenure Range:</span>
                    <span className="font-semibold">{p.min_tenure}–{p.max_tenure} months</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/user/apply?type=${encodeURIComponent(p.name)}`)}
                className="btn-primary w-full justify-center text-xs"
              >
                Apply Now <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications & Recent Applications Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">My Recent Applications</h3>
            <button onClick={() => navigate('/user/applications')} className="text-xs font-medium text-primary hover:underline">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="label-text border-b border-border">
                  <th className="pb-2 font-medium">Loan Type</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium text-ink-900">{r.loan_type}</td>
                    <td className="py-3 text-ink-700">₹{Number(r.loan_amount).toLocaleString('en-IN')}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3">
                      {r.status === 'approved' ? (
                        <button
                          onClick={() => navigate(`/user/agreement/${r.id}`)}
                          className="font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <ShieldCheck size={13} /> Agreement
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/user/eligibility')}
                          className="font-medium text-primary hover:underline"
                        >
                          View Eligibility
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {recentApps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-ink-400">
                      No applications submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink-900 flex items-center gap-2">
            <Bell size={16} className="text-primary" /> System Updates & Notifications
          </h3>
          <div className="flex flex-col gap-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-xl bg-card p-3 border border-border/60">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Bell size={14} />
                </div>
                <div>
                  <p className="text-xs text-ink-700 font-medium">{n.message}</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-xs text-ink-400 py-4 text-center">No new notifications.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
