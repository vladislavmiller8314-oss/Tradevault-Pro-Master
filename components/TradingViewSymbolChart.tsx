"use client";

import { useEffect, useRef, useState } from "react";

// TradingView "Advanced Chart" Widget — kostenloses Embed, kein API-Key.
// WICHTIG, ehrlich gesagt: Das zeigt den allgemeinen Marktverlauf für das
// Instrument, NICHT deinen exakten Ein-/Ausstiegspunkt als Markierung auf
// dem Chart eingezeichnet — echtes "Kerze-für-Kerze"-Replay mit deinen
// Punkten würde TradingViews kostenpflichtige Charting-Library brauchen
// (eigene Freigabe von TradingView nötig). Das hier ist der kostenlose,
// sofort nutzbare Zwischenschritt: Marktkontext ansehen, während du dir
// deine eigenen Notizen/den Screenshot daneben anschaust.
export function TradingViewSymbolChart({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const config = {
      autosize: true,
      symbol,
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "de_DE",
      backgroundColor: "rgba(15, 17, 23, 1)",
      gridColor: "rgba(36, 40, 54, 1)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      support_host: "https://www.tradingview.com",
    };

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify(config);
    script.onerror = () => setBlocked(true);
    container.current.appendChild(script);

    const timeout = setTimeout(() => {
      const rendered = container.current?.querySelector("iframe");
      if (!rendered) setBlocked(true);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [symbol]);

  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-ink-muted">Marktkontext ({symbol})</div>
      </div>
      {blocked && (
        <p className="text-xs text-ink-faint mb-2">
          Chart konnte nicht geladen werden — vermutlich blockiert ein
          Ad-/Tracking-Blocker die Verbindung zu TradingView.
        </p>
      )}
      <div className="tradingview-widget-container" ref={container} style={{ height: 420 }} />
      <p className="text-[11px] text-ink-faint mt-2">
        Zeigt den allgemeinen Marktverlauf, nicht deinen exakten Ein-/
        Ausstiegspunkt eingezeichnet. Nutz die Zeiten unten, um selbst zur
        richtigen Stelle zu navigieren.
      </p>
    </div>
  );
}
