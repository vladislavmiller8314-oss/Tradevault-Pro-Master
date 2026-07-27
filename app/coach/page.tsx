import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile, fetchTrades } from "@/lib/supabase/queries";
import type { CoachInsight } from "@/lib/coach";
import { generateFreeCoachInsights, generateAiCoachInsights } from "./actions";

const ICON: Record<CoachInsight["type"], string> = {
  staerke: "💪",
  schwaeche: "⚠️",
  tipp: "💡",
};

const LABEL: Record<CoachInsight["type"], string> = {
  staerke: "Stärke",
  schwaeche: "Schwäche",
  tipp: "Tipp",
};

const STYLE: Record<CoachInsight["type"], string> = {
  staerke: "border-gain/25 bg-gain/5",
  schwaeche: "border-loss/25 bg-loss/5",
  tipp: "border-panel-line bg-panel-inset",
};

export default async function CoachPage({
  searchParams,
}: {
  searchParams: { error?: string; generated?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [trades, profile, { data: latest }] = await Promise.all([
    fetchTrades(supabase, user.id),
    fetchProfile(supabase, user.id),
    supabase
      .from("coach_insights")
      .select("content, trade_count, created_at, source")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const insights = (latest?.content as CoachInsight[] | undefined) ?? [];
  const isStale = latest && latest.trade_count !== trades.length;

  return (
    <AppShell userEmail={user.email} musicProvider={profile.musicProvider} musicUrl={profile.musicUrl}>
      <div className="p-6 max-w-2xl">
        <div className="text-xs uppercase tracking-wider text-ink-muted mb-1">✦ Coach</div>
        <p className="text-sm text-ink-muted mb-4">
          Analysiert deine aggregierten Statistiken (nie einzelne Trades
          oder Kontostände) und zeigt Muster in deinem Trading — Stärken,
          Schwächen und konkrete Tipps. Die kostenlose Analyse läuft direkt
          hier, ohne externe API. Optional gibt es zusätzlich eine
          Claude-Analyse mit eigenem API-Key für nuanciertere Formulierungen.
        </p>

        {searchParams.error && (
          <div className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
            {searchParams.error}
          </div>
        )}
        {searchParams.generated && !searchParams.error && (
          <div className="mb-4 rounded-md border border-gain/30 bg-gain/10 px-3 py-2 text-sm text-gain">
            Neue Analyse erstellt.
          </div>
        )}

        {trades.length < 5 ? (
          <div className="rounded-panel bg-panel-raised border border-panel-line p-8 text-center">
            <p className="text-sm text-ink-muted mb-4">
              Noch zu wenige Trades für eine sinnvolle Analyse (mindestens 5
              nötig, aktuell {trades.length}).
            </p>
            <Link href="/trades/new" className="text-sm text-gain hover:underline">
              Trade erfassen →
            </Link>
          </div>
        ) : (
          <>
            {insights.length > 0 && (
              <>
                <div className="space-y-2 mb-4">
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 rounded-panel border p-3.5 ${STYLE[insight.type]}`}
                    >
                      <span className="text-lg leading-none">{ICON[insight.type]}</span>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-ink-faint mb-0.5">
                          {LABEL[insight.type]}
                        </div>
                        <p className="text-sm text-ink leading-relaxed">{insight.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-ink-faint mb-4">
                  {latest!.source === "ai" ? "Claude-Analyse" : "Kostenlose Analyse"} erstellt am{" "}
                  {new Date(latest!.created_at).toLocaleDateString("de-DE")} mit {latest!.trade_count}{" "}
                  Trades.
                  {isStale && " Seitdem sind neue Trades dazugekommen — eine neue Analyse berücksichtigt sie."}
                </div>
              </>
            )}

            <div className="space-y-2">
              <form action={generateFreeCoachInsights}>
                <button
                  type="submit"
                  className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2.5 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
                >
                  {insights.length > 0 ? "Kostenlos neu analysieren" : "Kostenlose Analyse erstellen"}
                </button>
              </form>
              <form action={generateAiCoachInsights}>
                <button
                  type="submit"
                  className="w-full rounded-panel border border-panel-line px-4 py-2.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  Mit Claude analysieren (eigener API-Key nötig)
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
