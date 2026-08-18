import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { JournalTable } from "@/components/JournalTable";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile, fetchTrades } from "@/lib/supabase/queries";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: { imported?: string; bulkDeleted?: string };
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
    <AppShell userEmail={user.email} musicLinks={profile.musicLinks}>
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
        {searchParams.bulkDeleted && (
          <div className="mb-4 rounded-md border border-gain/30 bg-gain/10 px-3 py-2 text-sm text-gain">
            {searchParams.bulkDeleted} Trade{searchParams.bulkDeleted === "1" ? "" : "s"} gelöscht.
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
          <JournalTable trades={trades} />
        )}
      </div>
    </AppShell>
  );
}
