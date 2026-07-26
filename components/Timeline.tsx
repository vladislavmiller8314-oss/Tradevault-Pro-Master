import { clsx } from "clsx";
import type { Trade } from "@/types/trade";

export function Timeline({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return <p className="text-sm text-ink-faint">Noch keine Trades vorhanden.</p>;
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-panel-line" />
      <div className="space-y-4">
        {trades.map((t) => (
          <div key={t.id} className="relative">
            <div
              className={clsx(
                "absolute -left-6 top-2 w-3 h-3 rounded-full border-2 border-panel",
                t.pnl >= 0 ? "bg-gain" : "bg-loss"
              )}
            />
            <div className="rounded-panel bg-panel-raised border border-panel-line p-4">
              <div className="flex items-center justify-between mb-1 gap-3">
                <div className="text-sm font-medium">
                  {t.instrument} · <span className={t.direction === "Long" ? "text-gain" : "text-loss"}>{t.direction}</span>
                </div>
                <div
                  className={clsx(
                    "tabular text-sm font-semibold shrink-0",
                    t.pnl >= 0 ? "text-gain" : "text-loss"
                  )}
                >
                  {t.pnl >= 0 ? "+" : ""}
                  {t.pnl.toFixed(2)} $
                </div>
              </div>
              <div className="text-xs text-ink-faint mb-2">
                {new Date(t.closedAt).toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {t.setup ? ` · ${t.setup}` : ""}
                {t.preTradeEmotion ? ` · vorher: ${t.preTradeEmotion}` : ""}
                {t.emotion ? ` · nachher: ${t.emotion}` : ""}
              </div>

              {t.screenshotUrl && (
                <a href={t.screenshotUrl} target="_blank" rel="noreferrer" className="block mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.screenshotUrl}
                    alt={`Screenshot ${t.instrument}`}
                    className="rounded-md border border-panel-line max-h-40 w-full object-cover"
                  />
                </a>
              )}

              {t.improvementNote && (
                <div className="text-xs text-ink-muted italic">„{t.improvementNote}"</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
