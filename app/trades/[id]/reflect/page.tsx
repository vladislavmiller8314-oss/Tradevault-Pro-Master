import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";
import { saveReflection, skipReflection } from "./actions";

const EMOTIONS = [
  { value: "Diszipliniert", emoji: "😊" },
  { value: "Ruhig", emoji: "😌" },
  { value: "Nervös", emoji: "😰" },
  { value: "Gier", emoji: "🤑" },
  { value: "FOMO", emoji: "😤" },
  { value: "Rache", emoji: "😡" },
  { value: "Neutral", emoji: "😐" },
];

const RULES = [
  { value: "eingehalten", emoji: "✅", label: "Eingehalten" },
  { value: "teilweise", emoji: "⚠️", label: "Teilweise" },
  { value: "gebrochen", emoji: "❌", label: "Gebrochen" },
];

const STRATEGIES = ["ORB", "VWAP Reject", "Breakout", "Range", "Trend Continuation"];

export default async function ReflectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: trade } = await supabase
    .from("trades")
    .select("id, instrument, direction, pnl, setup, emotion, rule_adherence")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!trade) {
    notFound();
  }

  const saveWithId = saveReflection.bind(null, trade.id);
  const profile = await fetchProfile(supabase, user.id);

  return (
    <AppShell userEmail={user.email} musicProvider={profile.musicProvider} musicUrl={profile.musicUrl}>
      <div className="p-6 max-w-lg mx-auto">
        <div className="text-center mb-5">
          <div className="text-xs uppercase tracking-wider text-ink-muted mb-1">
            Trade gespeichert
          </div>
          <div className="text-lg font-semibold text-ink">
            {trade.instrument} · {trade.direction}{" "}
            <span className={trade.pnl >= 0 ? "text-gain" : "text-loss"}>
              {trade.pnl >= 0 ? "+" : ""}
              {Number(trade.pnl).toFixed(2)} $
            </span>
          </div>
          <p className="text-xs text-ink-faint mt-1">
            Kurz reflektieren — dauert etwa 15 Sekunden.
          </p>
        </div>

        <form action={saveWithId} className="rounded-panel bg-panel-raised border border-panel-line p-5 space-y-5">
          {/* Emotion — ein Tap, kein Tippen */}
          <div>
            <label className="block text-xs text-ink-muted mb-2">Wie hast du dich gefühlt?</label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((e) => (
                <label key={e.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="emotion"
                    value={e.value}
                    defaultChecked={trade.emotion === e.value}
                    className="peer sr-only"
                  />
                  <span className="flex flex-col items-center gap-1 rounded-lg border border-panel-line bg-panel-inset px-3 py-2 text-xs text-ink-muted peer-checked:border-gain/50 peer-checked:bg-gain/10 peer-checked:text-gain transition-colors">
                    <span className="text-lg leading-none">{e.emoji}</span>
                    {e.value}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Regeleinhaltung — ein Tap */}
          <div>
            <label className="block text-xs text-ink-muted mb-2">Regeln eingehalten?</label>
            <div className="flex gap-2">
              {RULES.map((r) => (
                <label key={r.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="ruleAdherence"
                    value={r.value}
                    defaultChecked={trade.rule_adherence === r.value}
                    className="peer sr-only"
                  />
                  <span className="flex items-center justify-center gap-2 rounded-lg border border-panel-line bg-panel-inset px-3 py-2.5 text-xs text-ink-muted peer-checked:border-gain/50 peer-checked:bg-gain/10 peer-checked:text-gain transition-colors">
                    <span>{r.emoji}</span>
                    {r.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Strategie — ein Tap, mit Setup aus dem Trade vorbelegt */}
          <div>
            <label className="block text-xs text-ink-muted mb-2">Strategie / Setup</label>
            <div className="flex flex-wrap gap-2">
              {STRATEGIES.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input
                    type="radio"
                    name="setup"
                    value={s}
                    defaultChecked={trade.setup === s}
                    className="peer sr-only"
                  />
                  <span className="inline-block rounded-full border border-panel-line bg-panel-inset px-3 py-1.5 text-xs text-ink-muted peer-checked:border-gain/50 peer-checked:bg-gain/10 peer-checked:text-gain transition-colors">
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Ein Satz — schnell getippt, kein Roman */}
          <div>
            <label className="block text-xs text-ink-muted mb-1" htmlFor="improvementNote">
              Nächstes Mal besser machen (optional)
            </label>
            <input
              id="improvementNote"
              name="improvementNote"
              maxLength={140}
              placeholder="z. B. Stop nicht vorzeitig verschieben"
              className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-panel bg-gain/10 border border-gain/30 px-4 py-2.5 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Fertig
            </button>
            <button
              formAction={skipReflection}
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
