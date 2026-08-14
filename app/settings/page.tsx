import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";
import { InstallPrompt } from "@/components/InstallPrompt";
import { WIDGET_CATALOG } from "@/lib/widgets";
import { MUSIC_PROVIDERS, getMusicEmbedUrl } from "@/lib/music";
import { saveWidgetPreferences, saveMusicPreference, saveLeaderboardPreference, saveTradingRules } from "./actions";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: {
    musicError?: string;
    musicSaved?: string;
    leaderboardSaved?: string;
    leaderboardError?: string;
    widgetSaved?: string;
    widgetError?: string;
    rulesSaved?: string;
    rulesError?: string;
    rulesCount?: string;
  };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await fetchProfile(supabase, user.id);
  const previewUrl =
    profile.musicUrl && profile.musicProvider !== "none"
      ? getMusicEmbedUrl(profile.musicProvider, profile.musicUrl)
      : null;

  return (
    <AppShell userEmail={user.email} musicProvider={profile.musicProvider} musicUrl={profile.musicUrl}>
      <div className="p-6 max-w-2xl space-y-6">
        <div className="text-xs uppercase tracking-wider text-ink-muted">Einstellungen</div>

        {/* App installieren */}
        <div className="rounded-panel bg-panel-raised border border-panel-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">App installieren</h2>
          <p className="text-xs text-ink-muted mb-4">
            Installiert TradeVault Pro als App auf diesem Gerät — mit
            eigenem Icon, ohne Adressleiste, direkt vom Homescreen/
            Startmenü aus startbar. Funktioniert auf Windows, Mac,
            Android und iPhone/iPad.
          </p>
          <InstallPrompt />
        </div>

        {/* Dashboard-Widgets */}
        <div className="rounded-panel bg-panel-raised border border-panel-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Dashboard-Widgets</h2>
          <p className="text-xs text-ink-muted mb-4">
            Bestimme, welche Module auf deinem Dashboard erscheinen.
          </p>
          <form key={profile.activeWidgets.join(",")} action={saveWidgetPreferences} className="space-y-2">
            {WIDGET_CATALOG.map((w) => (
              <label
                key={w.key}
                className="flex items-center justify-between rounded-md px-3 py-2.5 bg-panel-inset border border-panel-line cursor-pointer"
              >
                <span className="text-sm text-ink">{w.label}</span>
                <input
                  type="checkbox"
                  name={`widget_${w.key}`}
                  defaultChecked={profile.activeWidgets.includes(w.key)}
                  className="w-4 h-4 accent-[#00C853]"
                />
              </label>
            ))}
            {searchParams.widgetError && (
              <div className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
                {searchParams.widgetError}
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors mt-2"
            >
              Widgets speichern
            </button>
          </form>
        </div>

        {/* Mein Regelwerk */}
        <div className="rounded-panel bg-panel-raised border border-panel-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Mein Regelwerk</h2>
          <p className="text-xs text-ink-muted mb-4">
            Deine persönlichen Trading-Regeln — eine pro Zeile. Erscheinen
            als eigenes Dashboard-Widget (falls oben aktiviert), damit du
            sie immer vor Augen hast.
          </p>

          {searchParams.rulesError && (
            <div className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
              {searchParams.rulesError}
            </div>
          )}
          {searchParams.rulesSaved && !searchParams.rulesError && (
            <div className="mb-4 rounded-md border border-gain/30 bg-gain/10 px-3 py-2 text-sm text-gain">
              Gespeichert ({searchParams.rulesCount ?? "?"} Regel(n) übermittelt). Server liest gerade{" "}
              {profile.tradingRules.length} Regel(n) aus der Datenbank.
            </div>
          )}

          <div className="mb-3 text-[10px] text-ink-faint font-mono break-all">
            Debug: profile.tradingRules = {JSON.stringify(profile.tradingRules)}
          </div>

          <form action={saveTradingRules} className="space-y-3">
            <textarea
              key={profile.tradingRules.join("|")}
              name="tradingRules"
              rows={6}
              placeholder={"z. B.\nImmer einen Stop-Loss setzen\nMax. 2% Risiko pro Trade\nNach 2 Verlusten Pause machen"}
              defaultValue={profile.tradingRules.join("\n")}
              className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
            />
            <button
              type="submit"
              className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Regelwerk speichern
            </button>
          </form>
        </div>

        {/* Musik-Integration */}
        <div className="rounded-panel bg-panel-raised border border-panel-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Musik-Integration</h2>
          <p className="text-xs text-ink-muted mb-4">
            Verknüpfe einen Track oder eine Playlist — erscheint dann über
            den Musik-Button oben rechts. Es wird nur der öffentliche Player
            eingebettet, kein Konto wird verknüpft oder benötigt.
          </p>

          {searchParams.musicError && (
            <div className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
              {searchParams.musicError}
            </div>
          )}
          {searchParams.musicSaved && !searchParams.musicError && (
            <div className="mb-4 rounded-md border border-gain/30 bg-gain/10 px-3 py-2 text-sm text-gain">
              Gespeichert.
            </div>
          )}

          <form key={`${profile.musicProvider}-${profile.musicUrl}`} action={saveMusicPreference} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="musicProvider"
                  value="none"
                  defaultChecked={profile.musicProvider === "none"}
                  className="peer sr-only"
                />
                <span className="flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm border border-panel-line bg-panel-inset text-ink-muted peer-checked:border-gain/50 peer-checked:bg-gain/10 peer-checked:text-gain transition-colors">
                  Keine
                </span>
              </label>
              {MUSIC_PROVIDERS.map((p) => (
                <label key={p.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="musicProvider"
                    value={p.value}
                    defaultChecked={profile.musicProvider === p.value}
                    className="peer sr-only"
                  />
                  <span className="flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm border border-panel-line bg-panel-inset text-ink-muted peer-checked:border-gain/50 peer-checked:bg-gain/10 peer-checked:text-gain transition-colors">
                    {p.label}
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs text-ink-muted mb-1" htmlFor="musicUrl">
                Link zu Track/Playlist
              </label>
              <input
                id="musicUrl"
                name="musicUrl"
                defaultValue={profile.musicUrl ?? ""}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
              />
              {profile.musicProvider !== "none" && (
                <p className="text-xs text-ink-faint mt-1">
                  {MUSIC_PROVIDERS.find((p) => p.value === profile.musicProvider)?.hint}
                </p>
              )}
            </div>

            {previewUrl && (
              <iframe
                src={previewUrl}
                width="100%"
                height={profile.musicProvider === "soundcloud" ? 166 : 152}
                frameBorder="0"
                className="rounded-md"
                title="Vorschau"
              />
            )}

            <button
              type="submit"
              className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Musik speichern
            </button>
          </form>
        </div>

        {/* Rangliste */}
        <div className="rounded-panel bg-panel-raised border border-panel-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Rangliste</h2>
          <p className="text-xs text-ink-muted mb-4">
            Optional: Vergleiche deine Winrate und deinen Profit Factor
            anonymisiert mit anderen Nutzern. Es werden nie einzelne Trades
            oder echte Euro-/Dollar-Beträge geteilt — nur die beiden
            Kennzahlen unter einem selbst gewählten Anzeigenamen. Ohne
            Zustimmung erscheinst du in der Rangliste gar nicht.
          </p>

          {searchParams.leaderboardError && (
            <div className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
              {searchParams.leaderboardError}
            </div>
          )}
          {searchParams.leaderboardSaved && !searchParams.leaderboardError && (
            <div className="mb-4 rounded-md border border-gain/30 bg-gain/10 px-3 py-2 text-sm text-gain">
              Gespeichert.
            </div>
          )}

          <form key={`${profile.leaderboardOptIn}-${profile.leaderboardDisplayName}`} action={saveLeaderboardPreference} className="space-y-3">
            <label className="flex items-center justify-between rounded-md px-3 py-2.5 bg-panel-inset border border-panel-line cursor-pointer">
              <span className="text-sm text-ink">An der Rangliste teilnehmen</span>
              <input
                type="checkbox"
                name="leaderboardOptIn"
                defaultChecked={profile.leaderboardOptIn}
                className="w-4 h-4 accent-[#00C853]"
              />
            </label>

            <div>
              <label className="block text-xs text-ink-muted mb-1" htmlFor="leaderboardDisplayName">
                Anzeigename in der Rangliste
              </label>
              <input
                id="leaderboardDisplayName"
                name="leaderboardDisplayName"
                maxLength={40}
                placeholder="z. B. dein Trading-Alias"
                defaultValue={profile.leaderboardDisplayName ?? ""}
                className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
              />
              <p className="text-xs text-ink-faint mt-1">
                Bitte keinen echten Namen/keine E-Mail verwenden. Leer
                gelassen erscheinst du als „Trader".
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Rangliste-Einstellung speichern
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
