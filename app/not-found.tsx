import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-panel px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Image src="/logo.png" alt="TradeVault Pro" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold tracking-tight text-ink">TradeVault Pro</span>
        </div>

        <div className="rounded-panel bg-panel-raised border border-panel-line p-8">
          <div className="text-4xl font-bold text-ink-faint mb-2">404</div>
          <h1 className="text-sm font-semibold text-ink mb-2">Seite nicht gefunden</h1>
          <p className="text-sm text-ink-muted mb-6">
            Diese Seite gibt es nicht oder der Trade wurde bereits gelöscht.
          </p>
          <Link
            href="/"
            className="inline-block rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
