import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, FileCheck, ShieldCheck, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import api from '../../api/client';

export default function UserApply() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'Personal Loan';

  const [form, setForm] = useState({
    loan_type: defaultType,
    loan_amount: '',
    tenure_months: 24,
    purpose: '',
    income: '75000',
    credit_score: '740',
    employment_type: 'Salaried',
    existing_emi: '10000',
    age: '30',
    govt_doc_type: 'aadhaar',
    govt_file_name: '',
    product_doc_type: 'salary_slip',
    product_file_name: '',
  });

  const [govtUploaded, setGovtUploaded] = useState(false);
  const [productUploaded, setProductUploaded] = useState(false);
  const [verifyingDocs, setVerifyingDocs] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/user/loan-products').then(({ data }) => setProducts(data)).catch(() => {});
    api.get('/auth/me').then(({ data }) => {
      if (data) {
        setForm((f) => ({
          ...f,
          income: String(data.monthly_income || 75000),
          credit_score: String(data.credit_score || 740),
          employment_type: data.employment_type || 'Salaried',
        }));
      }
    }).catch(() => {});
  }, []);

  // Update default product document requirement based on loan type selection
  useEffect(() => {
    let reqDoc = 'salary_slip';
    if (form.loan_type === 'Home Loan') reqDoc = 'house_document';
    else if (form.loan_type === 'Education Loan') reqDoc = 'bonafide';
    else if (form.loan_type === 'Vehicle Loan') reqDoc = 'driving_license';
    else if (form.loan_type === 'Business Loan') reqDoc = 'business_document';

    setForm((f) => ({ ...f, product_doc_type: reqDoc }));
    setProductUploaded(false);
  }, [form.loan_type]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSimulateGovtUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setVerifyingDocs(true);
    try {
      const { data } = await api.post('/documents/verify-pre-upload', {
        doc_type: form.govt_doc_type,
        file_name: file.name,
      });
      if (data.valid) {
        setForm((f) => ({ ...f, govt_file_name: file.name }));
        setGovtUploaded(true);
      } else {
        setGovtUploaded(false);
        setForm((f) => ({ ...f, govt_file_name: '' }));
        setError(data.message || `Invalid Document: File "${file.name}" failed AI OCR verification for ${form.govt_doc_type.toUpperCase()}. Please upload a valid original document.`);
      }
    } catch (err) {
      setGovtUploaded(false);
      setForm((f) => ({ ...f, govt_file_name: '' }));
      setError(err.response?.data?.message || `Invalid Document: File "${file.name}" failed AI OCR verification for ${form.govt_doc_type.toUpperCase()}. Please upload a valid original document.`);
    } finally {
      setVerifyingDocs(false);
    }
  };

  const handleSimulateProductUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setVerifyingDocs(true);
    try {
      const { data } = await api.post('/documents/verify-pre-upload', {
        doc_type: form.product_doc_type,
        file_name: file.name,
      });
      if (data.valid) {
        setForm((f) => ({ ...f, product_file_name: file.name }));
        setProductUploaded(true);
      } else {
        setProductUploaded(false);
        setForm((f) => ({ ...f, product_file_name: '' }));
        setError(data.message || `Invalid Document: File "${file.name}" failed AI OCR verification for ${form.product_doc_type.toUpperCase()}. Please upload a valid original document.`);
      }
    } catch (err) {
      setProductUploaded(false);
      setForm((f) => ({ ...f, product_file_name: '' }));
      setError(err.response?.data?.message || `Invalid Document: File "${file.name}" failed AI OCR verification for ${form.product_doc_type.toUpperCase()}. Please upload a valid original document.`);
    } finally {
      setVerifyingDocs(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!govtUploaded || !productUploaded) {
      setError('Document Verification Required: You must upload both a valid Govt ID and the Loan-Specific Document before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/user/applications', form);
      const appId = res.data?.id;
      if (appId) {
        navigate(`/applications/${appId}`);
      } else {
        navigate('/user/applications');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit loan application.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProd = products.find((p) => p.name === form.loan_type);

  const getProductDocLabel = () => {
    switch (form.loan_type) {
      case 'Home Loan':
        return { title: 'House Property Deed / Title Document', code: 'house_document', placeholder: 'e.g. house_deed_ownership.pdf' };
      case 'Education Loan':
        return { title: 'College Bonafide Certificate / Admission Proof', code: 'bonafide', placeholder: 'e.g. college_bonafide_cert.pdf' };
      case 'Vehicle Loan':
        return { title: 'Driving License / Vehicle Registration', code: 'driving_license', placeholder: 'e.g. driving_license_card.pdf' };
      case 'Business Loan':
        return { title: 'Business Registration / GST Certificate', code: 'business_document', placeholder: 'e.g. gst_business_reg.pdf' };
      default:
        return { title: 'Salary Slip / Income Proof', code: 'salary_slip', placeholder: 'e.g. salary_slip_recent.pdf' };
    }
  };

  const prodDocMeta = getProductDocLabel();

  return (
    <AppLayout title="Apply for Loan & Verify Documents">
      <Link to="/user/dashboard" className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-ink-900">Loan Application & Document Verification Wizard</h2>
              <p className="text-xs text-ink-500">Provide loan details, stated purpose, and mandatory verified documents.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
              <ShieldCheck size={14} className="text-indigo-600" /> Unbiased AI Inspection
            </span>
          </div>

          {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs text-danger flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

          {/* Section 1: Loan Request & Stated Reason */}
          <div className="mb-4 rounded-xl bg-card p-4 border border-border">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-600 flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" /> 1. Loan Details & Stated Reason
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">Select Loan Product</label>
                <select value={form.loan_type} onChange={update('loan_type')} className="input-field">
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.interest_rate}% p.a.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">Requested Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={10000}
                  value={form.loan_amount}
                  onChange={update('loan_amount')}
                  placeholder="e.g. 500000"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">Tenure (Months)</label>
                <input
                  type="number"
                  required
                  min={6}
                  max={240}
                  value={form.tenure_months}
                  onChange={update('tenure_months')}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">Stated Purpose / Reason for Loan</label>
                <input
                  required
                  value={form.purpose}
                  onChange={update('purpose')}
                  placeholder="e.g. Home Renovation / Education / Medical"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial Profile */}
          <div className="mb-4 rounded-xl bg-card p-4 border border-border">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-600">2. Financial Parameters</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">Monthly Income (₹)</label>
                <input
                  type="number"
                  required
                  min={10000}
                  value={form.income}
                  onChange={update('income')}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">Credit Score (CIBIL)</label>
                <input
                  type="number"
                  required
                  min={300}
                  max={900}
                  value={form.credit_score}
                  onChange={update('credit_score')}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">Employment Type</label>
                <select value={form.employment_type} onChange={update('employment_type')} className="input-field">
                  <option>Salaried</option>
                  <option>Self-Employed</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">Existing Monthly EMI (₹)</label>
                <input
                  type="number"
                  value={form.existing_emi}
                  onChange={update('existing_emi')}
                  placeholder="e.g. 10000"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">Applicant Age (Years)</label>
                <input
                  type="number"
                  required
                  min={18}
                  max={100}
                  value={form.age}
                  onChange={update('age')}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Mandatory Document Upload & AI Verification Gate */}
          <div className="mb-4 rounded-xl bg-card p-4 border border-indigo-200">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <FileCheck size={15} className="text-indigo-600" /> 3. Mandatory Document Upload & AI Verification Gate
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Required for AI Decision
              </span>
            </div>

            <p className="text-xs text-ink-500 mb-4">
              Before loan evaluation, AI performs a 100% thorough, unbiased inspection on uploaded documents. Approval or rejection will only process if documents are verified as original and authentic.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Document A: Govt Identity Document */}
              <div className="rounded-xl border border-border p-3 flex flex-col justify-between bg-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink-900">Govt ID Proof (Required)</span>
                    {govtUploaded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} /> 100% AI Verified
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Pending Upload</span>
                    )}
                  </div>

                  <div className="mb-2">
                    <select
                      value={form.govt_doc_type}
                      onChange={update('govt_doc_type')}
                      className="input-field text-xs py-1.5"
                    >
                      <option value="aadhaar">Aadhaar Card (Govt ID)</option>
                      <option value="pan">PAN Card (Govt ID)</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary-300 p-2 text-xs text-primary cursor-pointer hover:bg-primary-50 transition">
                    <UploadCloud size={15} />
                    <span>{form.govt_file_name || `Upload ${form.govt_doc_type.toUpperCase()} Card`}</span>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleSimulateGovtUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Document B: Product-Specific Document */}
              <div className="rounded-xl border border-border p-3 flex flex-col justify-between bg-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink-900">{prodDocMeta.title}</span>
                    {productUploaded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} /> 100% AI Verified
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Pending Upload</span>
                    )}
                  </div>

                  <p className="text-[11px] text-ink-500 mb-2 italic">
                    Loan product requirement for <span className="font-semibold text-ink-900">{form.loan_type}</span>.
                  </p>

                  <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 p-2 text-xs text-indigo-600 cursor-pointer hover:bg-indigo-50 transition">
                    <UploadCloud size={15} />
                    <span>{form.product_file_name || `Upload ${prodDocMeta.code.replace('_', ' ').toUpperCase()}`}</span>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleSimulateProductUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 text-white text-xs mb-4 flex items-center gap-3">
            <Sparkles size={20} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300 block">Strict AI Verification Guarantee</span>
              <p className="text-slate-300 mt-0.5">
                If documents are verified 100% authentic, Explainable AI will proceed to evaluate loan approval/rejection and display a transparent rationale report.
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3 border-t border-border pt-4">
            <button
              type="submit"
              disabled={submitting || verifyingDocs || !govtUploaded || !productUploaded}
              className="btn-primary"
            >
              <Send size={15} />
              {submitting ? 'AI Underwriting Application...' : 'Verify Documents & Run AI Decision'}
            </button>
            <button type="button" onClick={() => navigate('/user/dashboard')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>

        {/* Selected Product Guidance */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-900 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Product & Document Rules
          </h3>
          {selectedProd ? (
            <div className="flex flex-col gap-3 text-xs">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800 border border-emerald-200">
                <span className="font-bold block text-sm">{selectedProd.name}</span>
                <span className="text-[11px] font-semibold">Interest Rate: {selectedProd.interest_rate}% per annum</span>
              </div>

              <p className="text-ink-600">{selectedProd.description}</p>

              <div className="rounded-xl bg-indigo-50/70 p-3 text-indigo-900 border border-indigo-100">
                <span className="font-bold block mb-1">Required Product Document:</span>
                <p className="text-xs text-indigo-950 font-medium">
                  {form.loan_type === 'Home Loan' && '• House Property Ownership / Deed Certificate'}
                  {form.loan_type === 'Education Loan' && '• Institution Bonafide Certificate / Admission Proof'}
                  {form.loan_type === 'Vehicle Loan' && '• Valid Driving License / Vehicle Registration'}
                  {form.loan_type === 'Business Loan' && '• Business Registration / GST Certificate'}
                  {form.loan_type === 'Personal Loan' && '• Recent Salary Slip / Income Proof'}
                </p>
              </div>

              <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-ink-700">
                <div className="flex justify-between">
                  <span className="text-ink-400">Min Amount:</span>
                  <span className="font-medium">₹{Number(selectedProd.min_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Max Amount Cap:</span>
                  <span className="font-medium">₹{Number(selectedProd.max_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Tenure Limit:</span>
                  <span className="font-medium">{selectedProd.min_tenure} - {selectedProd.max_tenure} Months</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-400">Select a loan product to view parameters.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
