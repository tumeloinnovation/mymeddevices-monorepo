import { cn } from '../lib/utils'

export default function MonitorIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 280"
      className={cn("w-full max-w-[280px]", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="ecgGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,-8; 0,0"
          dur="3.5s"
          repeatCount="indefinite"
        />

        {/* monitor stand base */}
        <rect x="100" y="232" width="80" height="8" rx="4" fill="#94a3b8" />
        <rect x="125" y="214" width="30" height="20" rx="4" fill="#cbd5e1" />

        {/* monitor outer bezel */}
        <rect
          x="45"
          y="42"
          width="190"
          height="160"
          rx="16"
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth="2"
        />

        {/* screen */}
        <rect
          x="50"
          y="47"
          width="180"
          height="150"
          rx="10"
          fill="#0f172a"
        />

        {/* screen reflection */}
        <rect
          x="50"
          y="47"
          width="180"
          height="150"
          rx="10"
          fill="url(#screenGlow)"
        />

        {/* LED indicator */}
        <circle cx="220" cy="56" r="3" fill="#10b981">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* ECG waveform — draws across the screen */}
        <path
          d="M 65 130 L 82 130 L 90 85 L 98 175 L 106 110 L 113 130 L 175 130"
          stroke="url(#ecgGradient)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="250"
            to="0"
            dur="2.5s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
          />
          <animate
            attributeName="stroke-dasharray"
            from="0 250"
            to="250 0"
            dur="2.5s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
          />
        </path>

        {/* leading dot traveling along the ECG */}
        <circle r="4" fill="#10b981" filter="url(#glow)">
          <animateMotion
            dur="2.5s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
            path="M 65 130 L 82 130 L 90 85 L 98 175 L 106 110 L 113 130 L 175 130"
          />
        </circle>

        {/* question mark at the end */}
        <path
          d="M 190 118 C 190 108, 200 108, 200 118 C 200 126, 190 126, 190 118"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line x1="200" y1="118" x2="200" y2="132" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="200" cy="142" r="2.5" fill="#f59e0b">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  )
}
