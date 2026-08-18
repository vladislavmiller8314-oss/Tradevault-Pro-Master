import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ExitLegsInput } from "@/components/ExitLegsInput";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";
import { createTrade } from "./actions";

const inputClass =
  "w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50";
const labelClass = "block text-xs text-ink-muted mb-1";

export default async function NewTradePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: accounts }, profile] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type")
      .eq("is_archived", false)
      .order("created_at", { ascending: true }),
    fetchProfile(supabase, user.id),
  ]);

  return (
    <AppShell userEmail={user.email} musicLinks={profile.musicLinks}>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wider text-ink-muted">
            Neuer Trade
          </div>
          <Link href="/trades/import" className="text-xs text-ink-muted hover:text-ink">
            Stattdessen CSV importieren →
          </Link>
        </div>

        {!accounts || accounts.length === 0 ? (
          <div className="rounded-panel bg-panel-raised border border-panel-line p-6 text-center">
            <p className="text-sm text-ink-muted mb-4">
              Du hast noch kein Konto angelegt. Ein Trade muss immer einem
              Konto zugeordnet sein.
            </p>
            <Link
              href="/accounts"
              className="inline-block rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Erstes Konto anlegen
            </Link>
          </div>
        ) : (
          <div className="rounded-panel bg-panel-raised border border-panel-line p-5">
            {searchParams.error && (
              <div className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
                {searchParams.error}
              </div>
            )}

            <form action={createTrade} className="space-y-4" encType="multipart/form-data">
              <div>
                <label className={labelClass} htmlFor="accountId">
                  Konto
                </label>
                <select id="accountId" name="accountId" required className={inputClass}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="instrument">
                    Instrument
                  </label>
                  <input
                    id="instrument"
                    name="instrument"
                    required
                    placeholder="z. B. MES, ES, NQ"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="direction">
                    Richtung
                  </label>
                  <select id="direction" name="direction" required className={inputClass}>
                    <option value="Long">Long</option>
                    <option value="Short">Short</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="entryPrice">
                  Entry-Preis
                </label>
                <input
                  id="entryPrice"
                  name="entryPrice"
                  type="number"
                  step="0.00001"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass} htmlFor="stopPrice">
                    Stop (optional)
                  </label>
                  <input
                    id="stopPrice"
                    name="stopPrice"
                    type="number"
                    step="0.00001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="targetPrice">
                    Take Profit (optional)
                  </label>
                  <input
                    id="targetPrice"
                    name="targetPrice"
                    type="number"
                    step="0.00001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="fees">
                    Gebühren gesamt
                  </label>
                  <input
                    id="fees"
                    name="fees"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="pointValue">
                  Punktwert je Kontrakt
                </label>
                <input
                  id="pointValue"
                  name="pointValue"
                  type="number"
                  step="0.01"
                  defaultValue="1"
                  className={inputClass}
                />
                <p className="text-xs text-ink-faint mt-1">
                  Bestimmt die P&amp;L-Berechnung — z. B. 5 $ je Punkt bei MES,
                  2 $ bei MNQ. Bei 1 wird die Preisdifferenz direkt als $
                  gewertet.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="openedAt">
                  Einstiegszeit
                </label>
                <input
                  id="openedAt"
                  name="openedAt"
                  type="datetime-local"
                  required
                  className={inputClass}
                />
              </div>

              <ExitLegsInput />

              <div>
                <label className={labelClass} htmlFor="setup">
                  Setup
                </label>
                <input
                  id="setup"
                  name="setup"
                  placeholder="z. B. ORB, VWAP Reject"
                  className={inputClass}
                />
              </div>

              {profile.strategies.length > 0 && (
                <div>
                  <label className={labelClass}>Strategien (mehrere möglich)</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.strategies.map((s) => (
                      <label key={s} className="cursor-pointer">
                        <input type="checkbox" name="strategyTags" value={s} className="peer sr-only" />
                        <span className="inline-block rounded-md border border-panel-line bg-panel-inset px-3 py-1.5 text-xs text-ink-muted peer-checked:border-gain/50 peer-checked:bg-gain/10 peer-checked:text-gain transition-colors">
                          {s}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-ink-faint mt-1">
                    Neue Strategien trägst du unter Einstellungen ein.
                  </p>
                </div>
              )}

              <p className="text-xs text-ink-faint">
                Emotion und Regeleinhaltung fragen wir dich gleich nach dem
                Speichern in 15 Sekunden ab.
              </p>

              <div>
                <label className={labelClass} htmlFor="screenshot">
                  Screenshot (optional)
                </label>
                <input
                  id="screenshot"
                  name="screenshot"
                  type="file"
                  accept="image/*"
                  className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-panel-line file:px-3 file:py-1.5 file:text-ink file:text-xs`}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="notes">
                  Notizen
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Was lief gut, was nicht?"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
              >
                Trade speichern
              </button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
