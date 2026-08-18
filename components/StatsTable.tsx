import { clsx } from "clsx";
import type { StatsRow } from "@/lib/stats";

export function StatsTable({
  title,
  rows,
  firstCol,
  note,
}: {
  title: string;
  rows: StatsRow[];
  firstCol: string;
  note?: string;
}) {
  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-line">
        <div className="text-xs uppercase tracking-wider text-ink-muted">{title}</div>
        {note && <div className="text-[10px] text-ink-faint mt-0.5">{note}</div>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-faint border-b border-panel-line">
              <th className="px-4 py-2 font-medium">{firstCol}</th>
              <th className="px-4 py-2 font-medium">Trades</th>
              <th className="px-4 py-2 font-medium">Winrate</th>
              <th className="px-4 py-2 font-medium">Ø P&amp;L</th>
              <th className="px-4 py-2 font-medium text-right">Gesamt P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-panel-line last:border-0 hover:bg-panel/60">
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="tabular px-4 py-2.5">{r.count}</td>
                <td className="tabular px-4 py-2.5">{r.winrate}%</td>
                <td
                  className={clsx(
                    "tabular px-4 py-2.5",
                    r.avgPnl >= 0 ? "text-gain" : "text-loss"
                  )}
                >
                  {r.avgPnl >= 0 ? "+" : ""}
                  {r.avgPnl.toFixed(2)}
                </td>
                <td
                  className={clsx(
                    "tabular px-4 py-2.5 text-right font-semibold",
                    r.totalPnl >= 0 ? "text-gain" : "text-loss"
                  )}
                >
                  {r.totalPnl >= 0 ? "+" : ""}
                  {r.totalPnl.toFixed(2)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-faint">
                  Keine Daten
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
