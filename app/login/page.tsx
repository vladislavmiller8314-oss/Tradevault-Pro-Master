import Image from "next/image";
import { signIn, signUp } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-panel px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Image src="/logo.png" alt="TradeVault Pro" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold tracking-tight text-ink">TradeVault Pro</span>
        </div>

        <div className="rounded-panel bg-panel-raised border border-panel-line p-6 shadow-instrument">
          <h1 className="text-lg font-semibold text-ink mb-1">Anmelden</h1>
          <p className="text-sm text-ink-muted mb-6">
            Zugang zu deinem Trading Operating System.
          </p>

          {searchParams.error && (
            <div className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
              {searchParams.error}
            </div>
          )}
          {searchParams.message && (
            <div className="mb-4 rounded-md border border-gain/30 bg-gain/10 px-3 py-2 text-sm text-gain">
              {searchParams.message}
            </div>
          )}

          <form className="space-y-3">
            <div>
              <label className="block text-xs text-ink-muted mb-1" htmlFor="email">
                E-Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
                placeholder="du@beispiel.de"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1" htmlFor="password">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                className="w-full rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-sm text-ink outline-none focus:border-gain/50"
                placeholder="Mindestens 8 Zeichen"
              />
            </div>

            <button
              formAction={signIn}
              className="w-full rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Anmelden
            </button>
            <button
              formAction={signUp}
              className="w-full rounded-panel border border-panel-line px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
            >
              Konto erstellen
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-faint mt-4">
          Cloud-Synchronisierung über Supabase — deine Daten sind an dein Konto gebunden.
        </p>
      </div>
    </main>
  );
}
