"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) {
    return (
      <p className="text-sm text-gain">✓ Bereits als App installiert.</p>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={async () => {
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          setDeferredPrompt(null);
        }}
        className="flex items-center gap-2 rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
      >
        <Download size={16} />
        App installieren
      </button>
    );
  }

  if (isIOS) {
    return (
      <p className="text-sm text-ink-muted">
        Auf dem iPhone/iPad: Teilen-Symbol in Safari antippen → „Zum
        Home-Bildschirm" → Hinzufügen.
      </p>
    );
  }

  return (
    <p className="text-sm text-ink-muted">
      Dein Browser zeigt den Installieren-Button meist selbst in der
      Adressleiste an (kleines Symbol rechts).
    </p>
  );
}
