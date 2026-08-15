import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TradingViewSymbolChart } from "@/components/TradingViewSymbolChart";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";
import { mapInstrumentToTradingViewSymbol } from "@/lib/instrumentSymbols";

export default async function TradeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: trade }, profile] = await Promise.all([
    supabase.from("trades").select("*").eq("id", params.id).eq("user_id", user.id).single(),
    fetchProfile(supabase, user.id),
  ]);

  if (!trade) {
    notFound();
  }

  const symbol = mapInstrumentToTradingViewSymbol(trade.instrument);
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AppShell userEmail={user.email} musicProvider={profile.musicProvider} musicUrl={profile.musicUrl}>
      <div className="p-6 max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/replay" className="text-xs text-ink-muted hover:text-ink">
            ← Zurück zu Replay
          </Link>
          <Link
            href={`/trades/${trade.id}/edit`}
            className="text-xs text-gain hover:underline"
          >
            Bearbeiten
          </Link>
        </div>

        <div className="rounded-panel bg-panel-raised border border-panel-line p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold text-ink">
                {trade.instrument} · {trade.direction}
              </div>
              <div className="text-xs text-ink-muted">
                {fmtTime(trade.opened_at)} → {fmtTime(trade.closed_at)}
              </div>
            </div>
            <div className={`tabular text-xl font-bold ${trade.pnl >= 0 ? "text-gain" : "text-loss"}`}>
              {trade.pnl >= 0 ? "+" : ""}
              {Number(trade.pnl).toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-[10px] uppercase text-ink-faint">Kontrakte</div>
              <div className="tabular text-ink">{trade.contracts}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-ink-faint">Entry</div>
              <div className="tabular text-ink">{trade.entry_price}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-ink-faint">Exit</div>
              <div className="tabular text-ink">{trade.exit_price}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-ink-faint">Gebühren</div>
              <div className="tabular text-ink">{trade.fees}</div>
            </div>
            {trade.setup && (
              <div>
                <div className="text-[10px] uppercase text-ink-faint">Setup</div>
                <div className="text-ink">{trade.setup}</div>
              </div>
            )}
            {trade.pre_trade_emotion && (
              <div>
                <div className="text-[10px] uppercase text-ink-faint">Emotion vorher</div>
                <div className="text-ink">{trade.pre_trade_emotion}</div>
              </div>
            )}
            {trade.emotion && (
              <div>
                <div className="text-[10px] uppercase text-ink-faint">Emotion nachher</div>
                <div className="text-ink">{trade.emotion}</div>
              </div>
            )}
            {trade.rule_adherence && (
              <div>
                <div className="text-[10px] uppercase text-ink-faint">Regeleinhaltung</div>
                <div className="text-ink">
                  {trade.rule_adherence === "eingehalten" && "✅ Eingehalten"}
                  {trade.rule_adherence === "teilweise" && "⚠️ Teilweise"}
                  {trade.rule_adherence === "gebrochen" && "❌ Gebrochen"}
                </div>
              </div>
            )}
          </div>

          {trade.improvement_note && (
            <div className="mt-4 text-sm text-ink-muted italic">
              „{trade.improvement_note}"
            </div>
          )}

          {trade.notes && (
            <div className="mt-3 text-sm text-ink-muted whitespace-pre-wrap">{trade.notes}</div>
          )}

          {trade.screenshot_url && (
            <a href={trade.screenshot_url} target="_blank" rel="noreferrer" className="block mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={trade.screenshot_url}
                alt={`Screenshot ${trade.instrument}`}
                className="rounded-md border border-panel-line max-h-80 w-full object-contain bg-panel-inset"
              />
            </a>
          )}
        </div>

        <TradingViewSymbolChart symbol={symbol} />
      </div>
    </AppShell>
  );
}
