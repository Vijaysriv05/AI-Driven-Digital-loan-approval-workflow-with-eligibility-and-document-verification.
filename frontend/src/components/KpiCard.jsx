export default function KpiCard({ label, value, icon: Icon, accent = 'primary' }) {
  const accentMap = {
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-green-50 text-success',
    warning: 'bg-amber-50 text-warning',
    danger: 'bg-red-50 text-danger',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="label-text">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentMap[accent]}`}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}
