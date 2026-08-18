import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatsTable } from "@/components/StatsTable";
import { StatsBarList } from "@/components/StatsBarList";
import { createClient } from "@/lib/supabase/server";
import { fetchAccountsWithBalances, fetchProfile, fetchTrades } from "@/lib/supabase/queries";
import {
  groupBy,
  groupByMulti,
  toStatsRows,
  orderRowsByFixedSequence,
  weekdayLabel,
  hourBucketLabel,
  ruleLabel,
  WEEKDAY_ORDER,
  HOUR_BUCKET_ORDER,
  RULE_ORDER,
} from "@/lib/stats";

export default async function StatsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [trades, accounts, profile] = await Promise.all([
    fetchTrades(supabase, user.id),
    fetchAccountsWithBalances(supabase, user.id),
    fetchProfile(supabase, user.id),
  ]);

  const shellProps = { userEmail: user.email, musicLinks: profile.musicLinks };

  if (trades.length === 0) {
    return (
      <AppShell {...shellProps}>
        <div className="p-6">
          <div className="max-w-md mx-auto text-center rounded-panel bg-panel-raised border border-panel-line p-8 mt-12">
            <p className="text-sm text-ink-muted mb-4">
              Noch keine Trades vorhanden — Statistiken gibt es, sobald du
              deinen ersten Trade erfasst hast.
            </p>
            <Link
              href="/trades/new"
              className="inline-block rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Ersten Trade erfassen
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  const byInstrument = toStatsRows(groupBy(trades, (t) => t.instrument));
  const byStrategy = toStatsRows(
    groupByMulti(trades, (t) => (t.strategyTags.length > 0 ? t.strategyTags : [t.setup || "Ohne Strategie"]))
  );
  const byAccount = toStatsRows(
    groupBy(trades, (t) => accountNames[t.accountId] || "Unbekanntes Konto")
  );

  const byWeekday = orderRowsByFixedSequence(
    toStatsRows(groupBy(trades, (t) => weekdayLabel(new Date(t.closedAt)))),
    WEEKDAY_ORDER
  );
  const byHour = orderRowsByFixedSequence(
    toStatsRows(groupBy(trades, (t) => hourBucketLabel(new Date(t.closedAt)))),
    HOUR_BUCKET_ORDER
  );
  const byRule = orderRowsByFixedSequence(
    toStatsRows(groupBy(trades, (t) => ruleLabel(t.ruleAdherence))),
    RULE_ORDER
  );
  const byEmotion = toStatsRows(groupBy(trades, (t) => t.emotion || "Nicht angegeben"));
  const byEmotionBefore = toStatsRows(
    groupBy(trades, (t) => t.preTradeEmotion || "Nicht angegeben")
  );

  return (
    <AppShell {...shellProps}>
      <div className="p-6 space-y-6">
        <div className="text-xs uppercase tracking-wider text-ink-muted">
          Statistiken · {trades.length} Trades ausgewertet
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatsTable title="Nach Instrument" rows={byInstrument} firstCol="Instrument" />
          <StatsTable
            title="Nach Strategie"
            rows={byStrategy}
            firstCol="Strategie"
            note="Trades mit mehreren Strategien zählen bei jeder mit"
          />
        </div>

        <StatsTable title="Nach Konto" rows={byAccount} firstCol="Konto" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatsBarList title="Nach Wochentag" rows={byWeekday} />
          <StatsBarList title="Nach Uhrzeit" rows={byHour} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatsBarList title="Nach Regeleinhaltung" rows={byRule} />
          <StatsBarList title="Nach Emotion (nachher)" rows={byEmotion} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatsBarList title="Nach Emotion (vorher)" rows={byEmotionBefore} />
        </div>
      </div>
    </AppShell>
  );
}
