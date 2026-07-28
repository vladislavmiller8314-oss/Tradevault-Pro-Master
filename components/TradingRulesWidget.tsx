import Link from "next/link";

export function TradingRulesWidget({ rules }: { rules: string[] }) {
  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-ink-muted">📋 Mein Regelwerk</div>
        <Link href="/settings" className="text-xs text-ink-faint hover:text-ink transition-colors">
          Bearbeiten
        </Link>
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Noch keine Regeln eingetragen.{" "}
          <Link href="/settings" className="text-gain hover:underline">
            Jetzt festlegen
          </Link>
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink">
              <span className="text-ink-faint mt-0.5">{i + 1}.</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
