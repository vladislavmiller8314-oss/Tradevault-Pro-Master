import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";
import { IMPORT_TIMEZONES } from "@/lib/timezone";
import { importTradesCsv } from "./actions";

const inputClass =
  "w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50";
const labelClass = "block text-xs text-ink-muted mb-1";

export default async function ImportTradesPage({
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
          <div className="text-xs uppercase tracking-wider text-ink-muted">CSV-Import</div>
          <Link href="/trades/new" className="text-xs text-ink-muted hover:text-ink">
            Stattdessen einzeln erfassen →
          </Link>
        </div>

        <div className="rounded-panel bg-panel-raised border border-panel-line p-5 mb-4 text-sm text-ink-muted space-y-2">
          <p>
            Exportiere deine Handelshistorie aus deiner Plattform (z. B.
            Volume Trader Terminal, R|Trader Pro, NinjaTrader) als CSV und
            lade sie hier hoch. Zwei Formate werden automatisch erkannt:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>
              <strong>Fertige Trades:</strong> eine Zeile pro abgeschlossenem
              Trade mit Entry- und Exit-Preis
            </li>
            <li>
              <strong>Einzelne Fills:</strong> eine Zeile pro Kauf/Verkauf —
              wird automatisch per FIFO zu Trades zusammengeführt
            </li>
          </ul>
        </div>

        {!accounts || accounts.length === 0 ? (
          <div className="rounded-panel bg-panel-raised border border-panel-line p-6 text-center">
            <p className="text-sm text-ink-muted mb-4">
              Du hast noch kein Konto angelegt. Trades müssen einem Konto
              zugeordnet sein.
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

            <form action={importTradesCsv} className="space-y-4" encType="multipart/form-data">
              <div>
                <label className={labelClass} htmlFor="accountId">
                  Konto, dem die importierten Trades zugeordnet werden
                </label>
                <select id="accountId" name="accountId" required className={inputClass}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="timeZone">
                  Zeitzone der Uhrzeiten in der Datei
                </label>
                <select id="timeZone" name="timeZone" defaultValue="Europe/Berlin" className={inputClass}>
                  {IMPORT_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-ink-faint mt-1">
                  Wichtig für korrekte Zeiten: die Datei enthält Uhrzeiten
                  ohne Zeitzonen-Angabe — hier festlegen, in welcher Zeitzone
                  dein Handelsterminal die Uhrzeiten anzeigt (meist deine
                  eigene lokale Zeit).
                </p>
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
                  Gilt für alle importierten Trades in dieser Datei — z. B. 5
                  $ je Punkt bei MES. Enthält die Datei bereits fertige
                  P&amp;L-Werte, ist dieses Feld ohne Wirkung.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="file">
                  CSV-Datei
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-panel-line file:px-3 file:py-1.5 file:text-ink file:text-xs`}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
              >
                Trades importieren
              </button>
            </form>
          </div>
        )}

        <p className="text-xs text-ink-faint mt-4">
          Importierte Trades erhalten das Setup „CSV-Import" und werden ohne
          Emotion/Regeleinhaltung angelegt — die kannst du im Journal über
          „Bearbeiten" jederzeit nachtragen.
        </p>
      </div>
    </AppShell>
  );
}
