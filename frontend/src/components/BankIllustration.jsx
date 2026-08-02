export default function BankIllustration() {
  return (
    <svg viewBox="0 0 480 480" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="240" cy="240" r="200" fill="#EFF4FF" />
      <circle cx="240" cy="240" r="150" fill="#DBE7FE" opacity="0.6" />

      <g transform="translate(110,150)">
        <rect x="0" y="70" width="260" height="120" rx="12" fill="white" stroke="#2563EB" strokeWidth="3" />
        <rect x="20" y="70" width="8" height="120" fill="#2563EB" />
        <rect x="60" y="70" width="8" height="120" fill="#2563EB" />
        <rect x="100" y="70" width="8" height="120" fill="#2563EB" />
        <rect x="152" y="70" width="8" height="120" fill="#2563EB" />
        <rect x="192" y="70" width="8" height="120" fill="#2563EB" />
        <rect x="232" y="70" width="8" height="120" fill="#2563EB" />
        <polygon points="130,0 260,60 0,60" fill="#2563EB" />
        <rect x="-10" y="190" width="280" height="14" rx="4" fill="#1D4ED8" />
      </g>

      <g transform="translate(210,110)">
        <rect x="0" y="0" width="90" height="60" rx="10" fill="white" stroke="#2563EB" strokeWidth="3" />
        <circle cx="45" cy="30" r="14" fill="#2563EB" opacity="0.15" />
        <path d="M38 30 l5 5 l10 -10" stroke="#059669" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g transform="translate(80,300)">
        <rect x="0" y="0" width="70" height="46" rx="8" fill="white" stroke="#2563EB" strokeWidth="3" />
        <rect x="8" y="10" width="24" height="16" rx="3" fill="#2563EB" opacity="0.25" />
        <rect x="8" y="32" width="54" height="4" rx="2" fill="#98A2B3" />
      </g>

      <g transform="translate(330,300)">
        <circle cx="0" cy="0" r="34" fill="white" stroke="#2563EB" strokeWidth="3" />
        <path d="M-12 0 L-3 9 L14 -10" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
