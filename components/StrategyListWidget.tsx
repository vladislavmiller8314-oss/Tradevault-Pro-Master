import Link from "next/link";

export function StrategyListWidget({ strategies }: { strategies: string[] }) {
  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-ink-muted">🎯 Meine Strategien</div>
        <Link href="/settings" className="text-xs text-ink-faint hover:text-ink transition-colors">
          Bearbeiten
        </Link>
      </div>

      {strategies.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Noch keine Strategien eingetragen.{" "}
          <Link href="/settings" className="text-gain hover:underline">
            Jetzt festlegen
          </Link>
        </p>
      ) : (
        <ul className="space-y-1.5">
          {strategies.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink">
              <span className="text-ink-faint mt-0.5">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
