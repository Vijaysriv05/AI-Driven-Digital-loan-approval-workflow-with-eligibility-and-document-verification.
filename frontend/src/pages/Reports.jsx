import { useEffect, useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import api from '../api/client';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reports')
      .then(({ data }) => setReports(data))
      .finally(() => setLoading(false));
  }, []);

  const download = (type) => {
    const token = localStorage.getItem('nimbus_token');
    window.open(`${API_BASE}/reports/download/${type}?token=${token}`, '_blank');
  };

  return (
    <AppLayout title="Reports">
      <div className="card mb-4 flex flex-col gap-3 p-5 sm:flex-row">
        <button onClick={() => download('pdf')} className="btn-primary flex-1">
          <FileDown size={16} /> Download PDF
        </button>
        <button onClick={() => download('excel')} className="btn-secondary flex-1">
          <FileSpreadsheet size={16} /> Download Excel
        </button>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">Recent Reports</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="label-text border-b border-border">
              <th className="pb-2 pr-4 font-medium">Title</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Period</th>
              <th className="pb-2 font-medium">Generated</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium text-ink-900">{r.title}</td>
                <td className="py-3 pr-4 uppercase text-ink-700">{r.report_type}</td>
                <td className="py-3 pr-4 text-ink-700">{r.period}</td>
                <td className="py-3 text-ink-500">{new Date(r.generated_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!loading && reports.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-ink-400">
                  No reports generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
