"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import Link from "next/link";
import { addHighlight } from "@/app/replay/actions";
import { deleteTrade, bulkDeleteTrades } from "@/app/trades/[id]/edit/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import type { Trade } from "@/types/trade";

export function JournalTable({ trades }: { trades: Trade[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = trades.length > 0 && selected.size === trades.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(trades.map((t) => t.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex items-center justify-between mb-3 rounded-panel bg-gain/10 border border-gain/30 px-4 py-2.5">
          <span className="text-sm text-ink">{selected.size} ausgewählt</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-ink-muted hover:text-ink transition-colors"
            >
              Auswahl aufheben
            </button>
            <ConfirmButton
              action={bulkDeleteTrades}
              hiddenFields={{ tradeIds: selectedIds.join(",") }}
              confirmText={`${selected.size} Trade${selected.size === 1 ? "" : "s"} endgültig löschen? Das kann nicht rückgängig gemacht werden.`}
              className="text-xs font-medium text-loss hover:underline"
            >
              Ausgewählte löschen
            </ConfirmButton>
          </div>
        </div>
      )}

      <div className="rounded-panel bg-panel-raised border border-panel-line overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-faint border-b border-panel-line">
              <th className="px-4 py-3 font-medium w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-[#00C853]"
                />
              </th>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Instrument</th>
              <th className="px-4 py-3 font-medium">Richtung</th>
              <th className="px-4 py-3 font-medium">Kontrakte</th>
              <th className="px-4 py-3 font-medium">Entry</th>
              <th className="px-4 py-3 font-medium">Exit</th>
              <th className="px-4 py-3 font-medium">Setup</th>
              <th className="px-4 py-3 font-medium">Emotion (vorher → nachher)</th>
              <th className="px-4 py-3 font-medium">Regeln</th>
              <th className="px-4 py-3 font-medium">Replay</th>
              <th className="px-4 py-3 font-medium">Aktionen</th>
              <th className="px-4 py-3 font-medium text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr
                key={t.id}
                className={clsx(
                  "border-b border-panel-line last:border-0 hover:bg-panel/60",
                  selected.has(t.id) && "bg-gain/5"
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    className="w-4 h-4 accent-[#00C853]"
                  />
                </td>
                <td className="tabular px-4 py-3 text-ink-muted whitespace-nowrap">
                  {new Date(t.closedAt).toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3 font-medium">{t.instrument}</td>
                <td className="px-4 py-3">{t.direction}</td>
                <td className="tabular px-4 py-3">{t.contracts}</td>
                <td className="tabular px-4 py-3">{t.entryPrice}</td>
                <td className="tabular px-4 py-3">{t.exitPrice}</td>
                <td className="px-4 py-3 text-ink-muted">{t.setup || "—"}</td>
                <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                  {t.preTradeEmotion || "—"}
                  {(t.preTradeEmotion || t.emotion) && " → "}
                  {t.emotion || "—"}
                </td>
                <td className="px-4 py-3" title={t.improvementNote || undefined}>
                  {t.ruleAdherence === "eingehalten" && "✅"}
                  {t.ruleAdherence === "teilweise" && "⚠️"}
                  {t.ruleAdherence === "gebrochen" && "❌"}
                  {!t.ruleAdherence && <span className="text-ink-faint">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <form action={addHighlight}>
                      <input type="hidden" name="tradeId" value={t.id} />
                      <input type="hidden" name="category" value="hall_of_fame" />
                      <button
                        type="submit"
                        title="Zur Hall of Fame hinzufügen"
                        className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                      >
                        🏆
                      </button>
                    </form>
                    <form action={addHighlight}>
                      <input type="hidden" name="tradeId" value={t.id} />
                      <input type="hidden" name="category" value="hall_of_shame" />
                      <button
                        type="submit"
                        title="Zur Hall of Shame hinzufügen"
                        className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                      >
                        💀
                      </button>
                    </form>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/trades/${t.id}/edit`}
                      className="text-xs text-ink-muted hover:text-ink transition-colors"
                    >
                      Bearbeiten
                    </Link>
                    <ConfirmButton
                      action={deleteTrade}
                      hiddenFields={{ tradeId: t.id }}
                      confirmText={`${t.instrument}-Trade vom ${new Date(t.closedAt).toLocaleDateString("de-DE")} endgültig löschen?`}
                      className="text-xs text-ink-faint hover:text-loss transition-colors"
                    >
                      Löschen
                    </ConfirmButton>
                  </div>
                </td>
                <td
                  className={clsx(
                    "tabular px-4 py-3 text-right font-semibold",
                    t.pnl >= 0 ? "text-gain" : "text-loss"
                  )}
                >
                  {t.pnl >= 0 ? "+" : ""}
                  {t.pnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
