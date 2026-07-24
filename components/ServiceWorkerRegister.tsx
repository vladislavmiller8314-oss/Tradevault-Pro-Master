"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Kein Beinbruch, wenn das fehlschlägt — App funktioniert auch ohne,
        // nur die Installierbarkeit fällt dann weg.
      });
    }
  }, []);

  return null;
}
