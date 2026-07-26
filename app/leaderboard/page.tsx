import Link from "next/link";
import { clsx } from "clsx";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";

interface LeaderboardRow {
  display_name: string;
  trade_count: number;
  winrate: number;
  profit_factor: number | null;
  is_me: boolean;
}

export default async function LeaderboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, { data: rows, error }] = await Promise.all([
    fetchProfile(supabase, user.id),
    supabase.rpc("get_leaderboard"),
  ]);

  const leaderboard = (rows ?? []) as LeaderboardRow[];

  return (
    <AppShell userEmail={user.email} musicProvider={profile.musicProvider} musicUrl={profile.musicUrl}>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs uppercase tracking-wider text-ink-muted">Rangliste</div>
          <Link href="/settings" className="text-xs text-ink-muted hover:text-ink">
            Teilnahme verwalten →
          </Link>
        </div>
        <p className="text-sm text-ink-muted mb-4">
          Anonymisiert, opt-in — sortiert nach Profit Factor. Mindestens 3
          Trades nötig, um in der Liste zu erscheinen.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
            Rangliste konnte nicht geladen werden. Falls du gerade erst
            aktualisiert hast: bitte einmalig{" "}
            <code className="text-xs">supabase/migration_leaderboard.sql</code>{" "}
            im Supabase SQL-Editor ausführen.
          </div>
        )}

        {!profile.leaderboardOptIn && (
          <div className="mb-4 rounded-md border border-panel-line bg-panel-inset px-3 py-2.5 text-sm text-ink-muted">
            Du nimmst aktuell nicht teil — deine Werte fließen nicht ein und
            du siehst dich selbst nicht markiert.{" "}
            <Link href="/settings" className="text-gain hover:underline">
              Jetzt teilnehmen
            </Link>
          </div>
        )}

        {leaderboard.length === 0 && !error ? (
          <div className="rounded-panel bg-panel-raised border border-panel-line p-8 text-center text-sm text-ink-muted">
            Noch niemand in der Rangliste — sei die/der Erste.
          </div>
        ) : (
          <div className="rounded-panel bg-panel-raised border border-panel-line overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-faint border-b border-panel-line">
                  <th className="px-4 py-3 font-medium">Rang</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Trades</th>
                  <th className="px-4 py-3 font-medium">Winrate</th>
                  <th className="px-4 py-3 font-medium text-right">Profit Factor</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr
                    key={`${row.display_name}-${i}`}
                    className={clsx(
                      "border-b border-panel-line last:border-0",
                      row.is_me ? "bg-gain/5" : "hover:bg-panel/60"
                    )}
                  >
                    <td className="tabular px-4 py-3 text-ink-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {row.display_name}
                      {row.is_me && <span className="ml-2 text-xs text-gain">(du)</span>}
                    </td>
                    <td className="tabular px-4 py-3">{row.trade_count}</td>
                    <td className="tabular px-4 py-3">{row.winrate}%</td>
                    <td className="tabular px-4 py-3 text-right font-semibold">
                      {row.profit_factor !== null ? row.profit_factor.toFixed(2) : "—"}
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
