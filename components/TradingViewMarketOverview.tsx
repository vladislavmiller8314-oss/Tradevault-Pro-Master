"use client";

import { useEffect, useRef, useState } from "react";

// TradingView "Market Overview" Widget — kostenloses Embed, kein API-Key
// nötig. WICHTIG: reine CME-Futures-Symbole (z. B. CME_MINI:ES1!) verlangen
// bei TradingView ein Login bzw. Echtzeit-Datenabo für die Börse — ohne
// Login zeigt das eingebettete Widget dafür keine Daten an. Stattdessen
// hier die frei zugänglichen CFD-/Forex-Pendants derselben Märkte
// (dieselben Symbole, die TradingView in seinen eigenen Beispiel-Widgets
// verwendet), inhaltlich für Futures-Trader trotzdem aussagekräftig.
const WIDGET_CONFIG = {
  colorTheme: "dark",
  dateRange: "1D",
  showChart: false,
  locale: "de_DE",
  largeChartUrl: "",
  isTransparent: true,
  showSymbolLogo: true,
  showFloatingTooltip: false,
  width: "100%",
  height: "100%",
  plotLineColorGrowing: "rgba(0, 200, 83, 1)",
  plotLineColorFalling: "rgba(211, 47, 47, 1)",
  gridLineColor: "rgba(36, 40, 54, 1)",
  scaleFontColor: "rgba(139, 147, 167, 1)",
  belowLineFillColorGrowing: "rgba(0, 200, 83, 0.12)",
  belowLineFillColorFalling: "rgba(211, 47, 47, 0.12)",
  belowLineFillColorGrowingBottom: "rgba(0, 200, 83, 0)",
  belowLineFillColorFallingBottom: "rgba(211, 47, 47, 0)",
  symbolActiveColor: "rgba(0, 200, 83, 0.12)",
  tabs: [
    {
      title: "Märkte",
      symbols: [
        { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
        { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
        { s: "FOREXCOM:DJI", d: "Dow Jones" },
        { s: "TVC:USOIL", d: "Crude Oil" },
        { s: "TVC:GOLD", d: "Gold" },
        { s: "FX:EURUSD", d: "Euro FX" },
      ],
      originalTitle: "Märkte",
    },
  ],
};

export function TradingViewMarketOverview() {
  const container = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML =
      '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify(WIDGET_CONFIG);
    script.onerror = () => setBlocked(true);
    container.current.appendChild(script);

    // Manche Ad-/Tracking-Blocker verhindern das Nachladen lautlos (kein
    // onerror) — nach kurzer Wartezeit prüfen, ob überhaupt etwas gerendert wurde.
    const timeout = setTimeout(() => {
      const rendered = container.current?.querySelector("iframe");
      if (!rendered) setBlocked(true);
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">Marktmonitor</div>
      {blocked && (
        <p className="text-xs text-ink-faint mb-2">
          Marktdaten konnten nicht geladen werden — vermutlich blockiert ein
          Ad-/Tracking-Blocker die Verbindung zu TradingView. Diesen ggf.
          für diese Seite deaktivieren.
        </p>
      )}
      <div className="tradingview-widget-container" ref={container} style={{ height: 300 }} />
    </div>
  );
}
