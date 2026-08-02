const styles = {
  approved: 'bg-green-50 text-success',
  pending: 'bg-amber-50 text-warning',
  rejected: 'bg-red-50 text-danger',
  verified: 'bg-green-50 text-success',
  review: 'bg-amber-50 text-warning',
  missing: 'bg-red-50 text-danger',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const style = styles[key] || 'bg-card text-ink-500';
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  );
}
