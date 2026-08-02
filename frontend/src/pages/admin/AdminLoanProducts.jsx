import { useEffect, useState } from 'react';
import { Percent, Save, CheckCircle2, DollarSign } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import api from '../../api/client';

export default function AdminLoanProducts() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    interest_rate: '',
    min_amount: '',
    max_amount: '',
    min_tenure: '',
    max_tenure: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadProducts = () => {
    setLoading(true);
    api
      .get('/admin/loan-products')
      .then(({ data }) => {
        setProducts(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(String(data[0].id));
          populateForm(data[0]);
        } else if (selectedId) {
          const active = data.find((p) => String(p.id) === String(selectedId));
          if (active) populateForm(active);
        }
      })
      .finally(() => setLoading(false));
  };

  const populateForm = (product) => {
    setForm({
      interest_rate: product.interest_rate,
      min_amount: product.min_amount,
      max_amount: product.max_amount,
      min_tenure: product.min_tenure,
      max_tenure: product.max_tenure,
      description: product.description || '',
    });
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (idStr) => {
    setSelectedId(idStr);
    const prod = products.find((p) => String(p.id) === idStr);
    if (prod) populateForm(prod);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/admin/loan-products/${selectedId}`, form);
      setMessage('Loan product parameters and interest rate updated successfully!');
      loadProducts();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Failed to update loan product.');
    } finally {
      setSaving(false);
    }
  };

  const activeProduct = products.find((p) => String(p.id) === String(selectedId));

  return (
    <AppLayout title="Loan Products & Interest Rates Management (Admin)">
      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Product Selector */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-ink-900 flex items-center gap-2">
            <Percent size={16} className="text-primary" /> Loan Products
          </h3>
          <div className="flex flex-col gap-2">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(String(p.id))}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-semibold transition ${
                  String(p.id) === String(selectedId)
                    ? 'bg-primary-50 text-primary border border-primary-200 shadow-soft'
                    : 'bg-card text-ink-700 hover:bg-ink-50 border border-transparent'
                }`}
              >
                <span>{p.name}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {p.interest_rate}% p.a.
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Form */}
        <div className="card p-6 lg:col-span-2">
          {activeProduct ? (
            <form onSubmit={handleSave} className="flex flex-col gap-5 text-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-ink-900">{activeProduct.name} Configuration</h3>
                  <p className="text-[11px] text-ink-400">Update live interest rate and borrowing limits.</p>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary">
                  ID: #{activeProduct.id}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-ink-700">Interest Rate (% per annum)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={1}
                    max={50}
                    value={form.interest_rate}
                    onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))}
                    className="input-field text-xs font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-ink-700">Minimum Amount Limit (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.min_amount}
                    onChange={(e) => setForm((f) => ({ ...f, min_amount: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-ink-700">Maximum Amount Limit (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.max_amount}
                    onChange={(e) => setForm((f) => ({ ...f, max_amount: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-ink-700">Min Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.min_tenure}
                    onChange={(e) => setForm((f) => ({ ...f, min_tenure: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-ink-700">Max Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.max_tenure}
                    onChange={(e) => setForm((f) => ({ ...f, max_tenure: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block font-medium text-ink-700">Product Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end border-t border-border pt-4">
                <button type="submit" disabled={saving} className="btn-primary">
                  <Save size={15} />
                  {saving ? 'Updating Product...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-ink-400">Select a product to edit.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
