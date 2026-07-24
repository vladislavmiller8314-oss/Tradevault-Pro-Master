import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Timeline } from "@/components/Timeline";
import { HighlightCard } from "@/components/HighlightCard";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile, fetchTrades } from "@/lib/supabase/queries";
import type { Trade } from "@/types/trade";

export default async function ReplayPage() {
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

  const shellProps = { userEmail: user.email, musicProvider: profile.musicProvider, musicUrl: profile.musicUrl };

  if (trades.length === 0) {
    return (
      <AppShell {...shellProps}>
        <div className="p-6">
          <div className="max-w-md mx-auto text-center rounded-panel bg-panel-raised border border-panel-line p-8 mt-12">
            <p className="text-sm text-ink-muted mb-4">
              Noch keine Trades vorhanden — Replay und Hall of Fame/Shame
              füllen sich, sobald du Trades erfasst hast.
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

  const { data: highlightRows } = await supabase
    .from("trade_highlights")
    .select("id, category, comment, trade_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const tradeById: Record<string, Trade> = Object.fromEntries(trades.map((t) => [t.id, t]));

  const withTrade = (highlightRows ?? [])
    .map((h) => ({ ...h, trade: tradeById[h.trade_id] }))
    .filter((h): h is typeof h & { trade: Trade } => !!h.trade);

  const fame = withTrade.filter((h) => h.category === "hall_of_fame");
  const shame = withTrade.filter((h) => h.category === "hall_of_shame");

  return (
    <AppShell {...shellProps}>
      <div className="p-6 space-y-8">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">🏆 Hall of Fame</div>
          {fame.length === 0 ? (
            <p className="text-sm text-ink-faint">
              Noch keine Trades markiert. Im{" "}
              <Link href="/journal" className="text-gain hover:underline">
                Journal
              </Link>{" "}
              bei einem Trade auf 🏆 tippen.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fame.map((h) => (
                <HighlightCard key={h.id} highlight={h} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">💀 Hall of Shame</div>
          {shame.length === 0 ? (
            <p className="text-sm text-ink-faint">
              Noch keine Trades markiert. Im{" "}
              <Link href="/journal" className="text-gain hover:underline">
                Journal
              </Link>{" "}
              bei einem Trade auf 💀 tippen.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shame.map((h) => (
                <HighlightCard key={h.id} highlight={h} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">Timeline</div>
          <Timeline trades={trades} />
        </div>
      </div>
    </AppShell>
  );
}
