import { clsx } from "clsx";
import type { Trade } from "@/types/trade";

export function RecentTrades({ trades }: { trades: Trade[] }) {
  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">Letzte Trades</div>
      <div className="space-y-1">
        {trades.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-panel/60"
          >
            <div className="flex items-center gap-3">
              <span
                className={clsx(
                  "w-1.5 h-1.5 rounded-full",
                  t.pnl >= 0 ? "bg-gain" : "bg-loss"
                )}
              />
              <div>
                <div className="text-sm font-medium">{t.instrument}</div>
                <div className="text-xs text-ink-faint">
                  {t.direction} · {t.contracts} Kontrakte · {t.setup}
                </div>
              </div>
            </div>
            <div className={clsx("tabular text-sm font-semibold", t.pnl >= 0 ? "text-gain" : "text-loss")}>
              {t.pnl >= 0 ? "+" : ""}
              {t.pnl.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
