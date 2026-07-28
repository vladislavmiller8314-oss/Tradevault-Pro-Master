import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";
import { EMOTIONS } from "@/lib/tradeTags";
import { saveFeelingBefore, skipFeelingBefore } from "./actions";

export default async function FeelingBeforePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: trade } = await supabase
    .from("trades")
    .select("id, instrument, direction")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!trade) {
    notFound();
  }

  const profile = await fetchProfile(supabase, user.id);
  const saveWithId = saveFeelingBefore.bind(null, trade.id);
  const skipWithId = skipFeelingBefore.bind(null, trade.id);

  return (
    <AppShell userEmail={user.email} musicProvider={profile.musicProvider} musicUrl={profile.musicUrl}>
      <div className="p-6 max-w-lg mx-auto">
        <div className="text-center mb-5">
          <div className="text-xs uppercase tracking-wider text-ink-muted mb-1">
            Trade gespeichert
          </div>
          <div className="text-lg font-semibold text-ink">
            {trade.instrument} · {trade.direction}
          </div>
          <p className="text-xs text-ink-faint mt-1">Erster kurzer Schritt.</p>
        </div>

        <form action={saveWithId} className="rounded-panel bg-panel-raised border border-panel-line p-5 space-y-5">
          <div>
            <label className="block text-sm text-ink mb-3 text-center">
              Wie hast du dich <span className="font-semibold">vor</span> dem Trade gefühlt?
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {EMOTIONS.map((e) => (
                <label key={e.value} className="cursor-pointer">
                  <input type="radio" name="preTradeEmotion" value={e.value} className="peer sr-only" />
                  <span className="flex flex-col items-center gap-1 rounded-lg border border-panel-line bg-panel-inset px-3 py-2 text-xs text-ink-muted peer-checked:border-gain/50 peer-checked:bg-gain/10 peer-checked:text-gain transition-colors">
                    <span className="text-lg leading-none">{e.emoji}</span>
                    {e.value}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-panel bg-gain/10 border border-gain/30 px-4 py-2.5 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Weiter
            </button>
            <button
              formAction={skipWithId}
              className="rounded-panel border border-panel-line px-4 py-2.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              Überspringen
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
