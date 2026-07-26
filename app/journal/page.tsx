import { clsx } from "clsx";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ConfirmButton } from "@/components/ConfirmButton";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile, fetchTrades } from "@/lib/supabase/queries";
import { addHighlight } from "@/app/replay/actions";
import { deleteTrade } from "@/app/trades/[id]/edit/actions";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: { imported?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [trades, profile] = await Promise.all([
    fetchTrades(supabase, user.id),
    fetchProfile(supabase, user.id),
  ]);

  return (
    <AppShell userEmail={user.email} musicProvider={profile.musicProvider} musicUrl={profile.musicUrl}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-ink-muted">Trade Journal</div>
          <Link href="/trades/import" className="text-xs text-ink-muted hover:text-ink">
            CSV importieren →
          </Link>
        </div>

        {searchParams.imported && (
          <div className="mb-4 rounded-md border border-gain/30 bg-gain/10 px-3 py-2 text-sm text-gain">
            {searchParams.imported} Trade{searchParams.imported === "1" ? "" : "s"} erfolgreich importiert.
          </div>
        )}
        {trades.length === 0 ? (
          <div className="max-w-md mx-auto text-center rounded-panel bg-panel-raised border border-panel-line p-8 mt-8">
            <p className="text-sm text-ink-muted mb-4">Noch keine Trades erfasst.</p>
            <Link
              href="/trades/new"
              className="inline-block rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Ersten Trade erfassen
            </Link>
          </div>
        ) : (
          <div className="rounded-panel bg-panel-raised border border-panel-line overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-faint border-b border-panel-line">
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
                  <tr key={t.id} className="border-b border-panel-line last:border-0 hover:bg-panel/60">
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
        )}
      </div>
    </AppShell>
  );
}
