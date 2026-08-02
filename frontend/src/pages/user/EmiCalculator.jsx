import { useState } from 'react';
import { Calculator, DollarSign, Percent, Calendar, Sparkles } from 'lucide-react';
import AppLayout from '../../components/AppLayout';

export default function EmiCalculator() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(10.5);
  const [tenure, setTenure] = useState(36);

  // EMI Calculation: E = P * r * (1+r)^n / ((1+r)^n - 1)
  const calculateEmi = () => {
    const P = Number(amount) || 0;
    const r = (Number(rate) || 0) / 12 / 100;
    const n = Number(tenure) || 12;

    if (P <= 0 || r <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayable: 0 };

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - P;

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayable),
    };
  };

  const { emi, totalInterest, totalPayable } = calculateEmi();
  const principalPercent = totalPayable > 0 ? ((amount / totalPayable) * 100).toFixed(1) : 50;

  return (
    <AppLayout title="Interactive Loan EMI Calculator">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 backdrop-blur-md">
            <Calculator size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Loan EMI & Interest Calculator</h2>
            <p className="text-xs text-indigo-200">
              Calculate your exact monthly EMI payments, total interest obligations, and total repayment amount.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sliders Form */}
        <div className="card p-6 lg:col-span-2 flex flex-col gap-6">
          {/* Loan Amount Slider */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-primary" /> Loan Amount (₹)
              </label>
              <span className="text-base font-bold text-ink-900">₹{Number(amount).toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={25000}
              max={10000000}
              step={25000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[11px] text-ink-400">
              <span>₹25,000</span>
              <span>₹1,00,00,000</span>
            </div>
          </div>

          {/* Interest Rate Slider */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-700 uppercase tracking-wider flex items-center gap-1.5">
                <Percent size={14} className="text-emerald-600" /> Interest Rate (% p.a.)
              </label>
              <span className="text-base font-bold text-ink-900">{rate}%</span>
            </div>
            <input
              type="range"
              min={5.0}
              max={24.0}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[11px] text-ink-400">
              <span>5.0%</span>
              <span>24.0%</span>
            </div>
          </div>

          {/* Tenure Slider */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" /> Tenure (Months)
              </label>
              <span className="text-base font-bold text-ink-900">{tenure} Months ({ (tenure/12).toFixed(1) } Yrs)</span>
            </div>
            <input
              type="range"
              min={6}
              max={240}
              step={6}
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[11px] text-ink-400">
              <span>6 Months</span>
              <span>240 Months (20 Yrs)</span>
            </div>
          </div>
        </div>

        {/* EMI Result Summary Card */}
        <div className="card p-6 flex flex-col justify-between bg-white border border-border shadow-card">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Calculated Monthly Payment</span>
            <div className="mt-2 rounded-2xl bg-primary-50 p-4 text-center border border-primary-200">
              <span className="text-xs text-primary font-medium">Monthly EMI</span>
              <p className="text-3xl font-black text-primary-900 mt-1">₹{emi.toLocaleString('en-IN')}</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 text-xs border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Principal Loan Amount</span>
                <span className="font-bold text-ink-900">₹{Number(amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Total Interest Amount</span>
                <span className="font-bold text-emerald-700">₹{totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2 font-semibold">
                <span className="text-ink-900">Total Repayment Amount</span>
                <span className="text-ink-900 text-sm font-extrabold">₹{totalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Visual Ratio Bar */}
          <div className="mt-6 border-t border-border pt-4">
            <span className="text-[11px] font-medium text-ink-400 block mb-2">Payment Ratio Breakdown:</span>
            <div className="h-3 w-full rounded-full bg-emerald-100 flex overflow-hidden">
              <div style={{ width: `${principalPercent}%` }} className="bg-primary h-full" />
              <div style={{ width: `${100 - principalPercent}%` }} className="bg-emerald-500 h-full" />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-ink-500 font-medium">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Principal ({principalPercent}%)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Interest ({ (100 - principalPercent).toFixed(1) }%)</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
