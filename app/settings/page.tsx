import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";
import { InstallPrompt } from "@/components/InstallPrompt";
import { WIDGET_CATALOG } from "@/lib/widgets";
import { MUSIC_PROVIDERS, getMusicEmbedUrl } from "@/lib/music";
import { saveWidgetPreferences, saveMusicPreference } from "./actions";

export default async function SettingsPage() {
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
          <form action={saveWidgetPreferences} className="space-y-2">
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
            <button
              type="submit"
              className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors mt-2"
            >
              Widgets speichern
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

          <form action={saveMusicPreference} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm cursor-pointer border ${
                  profile.musicProvider === "none"
                    ? "border-gain/50 bg-gain/10 text-gain"
                    : "border-panel-line bg-panel-inset text-ink-muted"
                }`}
              >
                <input
                  type="radio"
                  name="musicProvider"
                  value="none"
                  defaultChecked={profile.musicProvider === "none"}
                  className="sr-only"
                />
                Keine
              </label>
              {MUSIC_PROVIDERS.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm cursor-pointer border ${
                    profile.musicProvider === p.value
                      ? "border-gain/50 bg-gain/10 text-gain"
                      : "border-panel-line bg-panel-inset text-ink-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="musicProvider"
                    value={p.value}
                    defaultChecked={profile.musicProvider === p.value}
                    className="sr-only"
                  />
                  {p.label}
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
      </div>
    </AppShell>
  );
}
