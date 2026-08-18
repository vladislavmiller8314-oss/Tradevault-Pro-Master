import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ConfirmButton } from "@/components/ConfirmButton";
import { createClient } from "@/lib/supabase/server";
import { fetchAccountsWithBalances, fetchProfile } from "@/lib/supabase/queries";
import { createAccount, archiveAccount, reactivateAccount, deleteAccount } from "./actions";

export default async function AccountsPage({
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

  const [accounts, profile] = await Promise.all([
    fetchAccountsWithBalances(supabase, user.id, { includeArchived: true }),
    fetchProfile(supabase, user.id),
  ]);

  const active = accounts.filter((a) => !a.isArchived);
  const inactive = accounts.filter((a) => a.isArchived);
  const totalBalance = active.reduce((sum, a) => sum + a.balance, 0);

  return (
    <AppShell userEmail={user.email} musicLinks={profile.musicLinks}>
      <div className="p-6 space-y-6 max-w-2xl">
        {active.length > 0 && (
          <div className="rounded-panel bg-panel-raised border border-panel-line p-4">
            <div className="text-xs uppercase tracking-wider text-ink-muted mb-1">
              Gesamt-Guthaben (aktive Konten)
            </div>
            <div className="tabular text-2xl font-semibold text-ink">
              {totalBalance.toLocaleString("de-DE", { style: "currency", currency: active[0].currency })}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">
            Aktive Konten
          </div>

          {active.length > 0 ? (
            <div className="space-y-2">
              {active.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-panel bg-panel-raised border border-panel-line px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">{a.name}</div>
                    <div className="text-xs text-ink-muted">
                      {a.type} · {a.broker || "kein Broker hinterlegt"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="tabular text-sm font-semibold text-ink">
                        {a.balance.toLocaleString("de-DE", { style: "currency", currency: a.currency })}
                      </div>
                      <div
                        className={`tabular text-xs ${a.totalPnl >= 0 ? "text-gain" : "text-loss"}`}
                      >
                        {a.totalPnl >= 0 ? "+" : ""}
                        {a.totalPnl.toLocaleString("de-DE", { style: "currency", currency: a.currency })}{" "}
                        gesamt
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ConfirmButton
                        action={archiveAccount}
                        hiddenFields={{ accountId: a.id }}
                        confirmText={`"${a.name}" zu inaktiven Konten verschieben? Es taucht dann nicht mehr im Dashboard auf, bleibt aber erhalten.`}
                        className="text-xs text-ink-faint hover:text-ink transition-colors"
                      >
                        Zu Inaktiv
                      </ConfirmButton>
                      <ConfirmButton
                        action={deleteAccount}
                        hiddenFields={{ accountId: a.id }}
                        confirmText={`"${a.name}" endgültig löschen? Alle Trades auf diesem Konto werden dabei ebenfalls gelöscht. Das kann nicht rückgängig gemacht werden.`}
                        className="text-xs text-ink-faint hover:text-loss transition-colors"
                      >
                        Löschen
                      </ConfirmButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-ink-muted rounded-panel border border-dashed border-panel-line px-4 py-6 text-center">
              Noch kein Konto angelegt. Lege dein erstes Konto an, um danach
              Trades erfassen zu können.
            </div>
          )}
        </div>

        {inactive.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">
              Inaktive Konten
            </div>
            <div className="space-y-2">
              {inactive.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-panel bg-panel-inset border border-panel-line px-4 py-3 opacity-70"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">{a.name}</div>
                    <div className="text-xs text-ink-muted">
                      {a.type} · {a.broker || "kein Broker hinterlegt"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="tabular text-sm text-ink-muted">
                        {a.balance.toLocaleString("de-DE", { style: "currency", currency: a.currency })}
                      </div>
                      <div className={`tabular text-xs ${a.totalPnl >= 0 ? "text-gain" : "text-loss"}`}>
                        {a.totalPnl >= 0 ? "+" : ""}
                        {a.totalPnl.toLocaleString("de-DE", { style: "currency", currency: a.currency })}{" "}
                        gesamt
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ConfirmButton
                        action={reactivateAccount}
                        hiddenFields={{ accountId: a.id }}
                        confirmText={`"${a.name}" wieder aktivieren?`}
                        className="text-xs text-gain hover:underline"
                      >
                        Reaktivieren
                      </ConfirmButton>
                      <ConfirmButton
                        action={deleteAccount}
                        hiddenFields={{ accountId: a.id }}
                        confirmText={`"${a.name}" endgültig löschen? Alle Trades auf diesem Konto werden dabei ebenfalls gelöscht. Das kann nicht rückgängig gemacht werden.`}
                        className="text-xs text-ink-faint hover:text-loss transition-colors"
                      >
                        Löschen
                      </ConfirmButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-panel bg-panel-raised border border-panel-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-4">Konto hinzufügen</h2>

          {searchParams.error && (
            <div className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
              {searchParams.error}
            </div>
          )}

          <form action={createAccount} className="space-y-3">
            <div>
              <label className="block text-xs text-ink-muted mb-1" htmlFor="name">
                Kontoname
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="z. B. Apex 50K Evaluation"
                className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1" htmlFor="type">
                  Typ
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
                >
                  <option value="Prop">Prop</option>
                  <option value="Live">Live</option>
                  <option value="Demo">Demo</option>
                  <option value="Evaluation">Evaluation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1" htmlFor="currency">
                  Währung
                </label>
                <input
                  id="currency"
                  name="currency"
                  defaultValue="USD"
                  className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1" htmlFor="startingBalance">
                  Startkapital
                </label>
                <input
                  id="startingBalance"
                  name="startingBalance"
                  type="number"
                  step="0.01"
                  required
                  placeholder="50000"
                  className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1" htmlFor="broker">
                  Broker (optional)
                </label>
                <input
                  id="broker"
                  name="broker"
                  placeholder="z. B. Tradovate"
                  className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Konto speichern
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
