import { clsx } from "clsx";
import type { StatsRow } from "@/lib/stats";

export function StatsBarList({ title, rows }: { title: string; rows: StatsRow[] }) {
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.totalPnl)), 1);

  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-ink-faint text-center py-4">Keine Daten</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center gap-3">
              <span className="text-xs text-ink-muted w-24 shrink-0 truncate" title={r.name}>
                {r.name}
              </span>
              <div className="flex-1 h-2 rounded-full bg-panel-inset overflow-hidden">
                <div
                  className={clsx("h-full", r.totalPnl >= 0 ? "bg-gain" : "bg-loss")}
                  style={{ width: `${(Math.abs(r.totalPnl) / maxAbs) * 100}%` }}
                />
              </div>
              <span className="text-xs text-ink-faint w-14 shrink-0">{r.count}× · {r.winrate}%</span>
              <span
                className={clsx(
                  "tabular text-xs w-20 shrink-0 text-right font-semibold",
                  r.totalPnl >= 0 ? "text-gain" : "text-loss"
                )}
              >
                {r.totalPnl >= 0 ? "+" : ""}
                {r.totalPnl.toFixed(0)} $
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
