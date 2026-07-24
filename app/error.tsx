"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Zentrale Stelle, um Fehler an ein Monitoring-Tool zu schicken
    // (Sentry o. ä.), sobald eins angebunden ist.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-panel px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Image src="/logo.png" alt="TradeVault Pro" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold tracking-tight text-ink">TradeVault Pro</span>
        </div>

        <div className="rounded-panel bg-panel-raised border border-panel-line p-8">
          <div className="text-4xl mb-2">⚠️</div>
          <h1 className="text-sm font-semibold text-ink mb-2">Etwas ist schiefgelaufen</h1>
          <p className="text-sm text-ink-muted mb-6">
            Das war unerwartet. Versuch es noch einmal — deine Daten sind
            davon nicht betroffen.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Erneut versuchen
            </button>
            <Link
              href="/"
              className="rounded-panel border border-panel-line px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              Zum Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
