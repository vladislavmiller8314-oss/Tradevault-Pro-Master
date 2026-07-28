import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";
import { EMOTIONS, RULE_OPTIONS } from "@/lib/tradeTags";
import { updateTrade } from "./actions";

const inputClass =
  "w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50";
const labelClass = "block text-xs text-ink-muted mb-1";

// Wandelt einen ISO-Zeitstempel in das Format um, das <input type="datetime-local">
// als defaultValue erwartet (lokale Zeit, ohne Sekunden/Zeitzone).
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditTradePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: trade }, { data: accounts }, profile] = await Promise.all([
    supabase.from("trades").select("*").eq("id", params.id).eq("user_id", user.id).single(),
    supabase
      .from("accounts")
      .select("id, name, type")
      .eq("is_archived", false)
      .order("created_at", { ascending: true }),
    fetchProfile(supabase, user.id),
  ]);

  if (!trade) {
    notFound();
  }

  const updateWithId = updateTrade.bind(null, trade.id);

  return (
    <AppShell userEmail={user.email} musicProvider={profile.musicProvider} musicUrl={profile.musicUrl}>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wider text-ink-muted">
            Trade bearbeiten
          </div>
          <Link href="/journal" className="text-xs text-ink-muted hover:text-ink">
            ← Zurück zum Journal
          </Link>
        </div>

        <div className="rounded-panel bg-panel-raised border border-panel-line p-5">
          {searchParams.error && (
            <div className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
              {searchParams.error}
            </div>
          )}

          <form action={updateWithId} className="space-y-4" encType="multipart/form-data">
            <div>
              <label className={labelClass} htmlFor="accountId">
                Konto
              </label>
              <select
                id="accountId"
                name="accountId"
                required
                defaultValue={trade.account_id}
                className={inputClass}
              >
                {(accounts ?? []).map((a) => (
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
                  defaultValue={trade.instrument}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="direction">
                  Richtung
                </label>
                <select
                  id="direction"
                  name="direction"
                  required
                  defaultValue={trade.direction}
                  className={inputClass}
                >
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass} htmlFor="contracts">
                  Kontrakte
                </label>
                <input
                  id="contracts"
                  name="contracts"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={trade.contracts}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="entryPrice">
                  Entry
                </label>
                <input
                  id="entryPrice"
                  name="entryPrice"
                  type="number"
                  step="0.00001"
                  required
                  defaultValue={trade.entry_price}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="exitPrice">
                  Exit
                </label>
                <input
                  id="exitPrice"
                  name="exitPrice"
                  type="number"
                  step="0.00001"
                  required
                  defaultValue={trade.exit_price}
                  className={inputClass}
                />
              </div>
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
                  defaultValue={trade.stop_price ?? ""}
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
                  defaultValue={trade.target_price ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="fees">
                  Gebühren
                </label>
                <input
                  id="fees"
                  name="fees"
                  type="number"
                  step="0.01"
                  defaultValue={trade.fees}
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
                Der ursprüngliche Punktwert wird nicht gespeichert — bitte bei
                Bedarf erneut eintragen, sonst wird die P&amp;L mit 1
                neu berechnet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="openedAt">
                  Einstiegszeit
                </label>
                <input
                  id="openedAt"
                  name="openedAt"
                  type="datetime-local"
                  required
                  defaultValue={toDatetimeLocal(trade.opened_at)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="closedAt">
                  Ausstiegszeit
                </label>
                <input
                  id="closedAt"
                  name="closedAt"
                  type="datetime-local"
                  required
                  defaultValue={toDatetimeLocal(trade.closed_at)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="setup">
                Setup
              </label>
              <input
                id="setup"
                name="setup"
                defaultValue={trade.setup ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Emotion vor dem Trade</label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((e) => (
                  <label key={e.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="preTradeEmotion"
                      value={e.value}
                      defaultChecked={trade.pre_trade_emotion === e.value}
                      className="peer sr-only"
                    />
                    <span className="flex flex-col items-center gap-1 rounded-lg border border-panel-line bg-panel-inset px-2.5 py-2 text-[11px] text-ink-muted peer-checked:border-gain/50 peer-checked:bg-gain/10 peer-checked:text-gain transition-colors">
                      <span className="text-base leading-none">{e.emoji}</span>
                      {e.value}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Emotion nach dem Trade</label>
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
                    <span className="flex flex-col items-center gap-1 rounded-lg border border-panel-line bg-panel-inset px-2.5 py-2 text-[11px] text-ink-muted peer-checked:border-gain/50 peer-checked:bg-gain/10 peer-checked:text-gain transition-colors">
                      <span className="text-base leading-none">{e.emoji}</span>
                      {e.value}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Regeleinhaltung</label>
              <div className="flex gap-2">
                {RULE_OPTIONS.map((r) => (
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

            <div>
              <label className={labelClass} htmlFor="improvementNote">
                Nächstes Mal besser machen
              </label>
              <input
                id="improvementNote"
                name="improvementNote"
                maxLength={140}
                placeholder="z. B. Stop nicht vorzeitig verschieben"
                defaultValue={trade.improvement_note ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="screenshot">
                Neuen Screenshot hochladen (optional, ersetzt den bisherigen)
              </label>
              <input
                id="screenshot"
                name="screenshot"
                type="file"
                accept="image/*"
                className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-panel-line file:px-3 file:py-1.5 file:text-ink file:text-xs`}
              />
              {trade.screenshot_url && (
                <p className="text-xs text-ink-faint mt-1">
                  Aktuell ist bereits ein Screenshot hinterlegt.
                </p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="notes">
                Notizen
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={trade.notes ?? ""}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Änderungen speichern
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
