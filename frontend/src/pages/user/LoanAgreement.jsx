import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, ShieldCheck, Printer } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import api from '../../api/client';

export default function LoanAgreement() {
  const { id } = useParams();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/user/agreement/${id}`)
      .then(({ data }) => setAgreement(data))
      .catch(() => setAgreement(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppLayout title="Sanctioned Loan Agreement">
        <p className="text-xs text-ink-400">Generating agreement document...</p>
      </AppLayout>
    );
  }

  if (!agreement) {
    return (
      <AppLayout title="Sanctioned Loan Agreement">
        <p className="text-xs text-ink-400">Agreement not found or application is pending approval.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Sanctioned Loan Agreement">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/user/dashboard" className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary text-xs">
            <Printer size={14} /> Print
          </button>
          <button onClick={handlePrint} className="btn-primary text-xs">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      <div className="card mx-auto max-w-3xl p-8 bg-white shadow-card border border-border">
        <div className="flex items-center justify-between border-b-2 border-primary pb-4">
          <div>
            <h1 className="text-xl font-bold text-ink-900">NIMBUS LENDING</h1>
            <p className="text-xs text-ink-500">Financial Services & AI Credit System</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <ShieldCheck size={16} /> Sanctioned & Verified
          </div>
        </div>

        <div className="my-6 rounded-xl bg-card p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed text-ink-800 border border-border">
          {agreement.agreementText}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs text-ink-500">
          <span>Borrower Signature: Digitally Authenticated</span>
          <span>Lender Representative: Nimbus AI Risk Officer</span>
        </div>
      </div>
    </AppLayout>
  );
}
