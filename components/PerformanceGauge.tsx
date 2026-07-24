interface PerformanceGaugeProps {
  label: string;
  value: number;   // 0–100 for winrate, or normalized 0–100 for profit factor display
  displayValue: string;
  redline?: number; // point at which the arc turns from gain to loss color
}

// A circular instrument dial in the spirit of a Porsche rev counter:
// swept arc, tick marks, a redline threshold, and a needle-less
// filled arc so it reads instantly at a glance — no digits required
// to know if you're "in the green".
export function PerformanceGauge({ label, value, displayValue, redline = 50 }: PerformanceGaugeProps) {
  const radius = 54;
  const circumference = Math.PI * radius; // half circle
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  const inGreen = clamped >= redline;

  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument flex flex-col items-center">
      <div className="text-xs uppercase tracking-wider text-ink-muted self-start">{label}</div>
      <svg viewBox="0 0 140 80" className="mt-2 w-full max-w-[180px]">
        {/* Dial background track */}
        <path
          d="M 13 70 A 54 54 0 0 1 127 70"
          fill="none"
          stroke="#0A0B10"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Tick marks — instrument-panel detailing */}
        {ticks.map((t) => {
          const angle = Math.PI - (t / 100) * Math.PI;
          const x1 = 70 + 48 * Math.cos(angle);
          const y1 = 70 - 48 * Math.sin(angle);
          const x2 = 70 + 54 * Math.cos(angle);
          const y2 = 70 - 54 * Math.sin(angle);
          return (
            <line
              key={t}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#242836"
              strokeWidth="2"
            />
          );
        })}
        {/* Filled progress arc */}
        <path
          d="M 13 70 A 54 54 0 0 1 127 70"
          fill="none"
          stroke={inGreen ? "#00C853" : "#D32F2F"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="tabular -mt-6 text-xl font-semibold text-ink">{displayValue}</div>
    </div>
  );
}
