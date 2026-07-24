"use client";

import { useEffect, useRef } from "react";

// TradingView "Market Overview" Widget — kostenloses Embed, kein API-Key
// nötig. Symbole ausgewählt für Futures-Trader (Indizes, Öl, Gold, Euro FX).
// Weitere Symbole/Tabs: https://www.tradingview.com/widget-docs/widgets/watchlists/market-overview/
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
      title: "Futures",
      symbols: [
        { s: "CME_MINI:ES1!", d: "E-mini S&P 500" },
        { s: "CME_MINI:NQ1!", d: "E-mini Nasdaq 100" },
        { s: "CBOT_MINI:YM1!", d: "Mini Dow" },
        { s: "NYMEX:CL1!", d: "Crude Oil" },
        { s: "COMEX:GC1!", d: "Gold" },
        { s: "CME:6E1!", d: "Euro FX" },
      ],
      originalTitle: "Futures",
    },
  ],
};

export function TradingViewMarketOverview() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML =
      '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify(WIDGET_CONFIG);
    container.current.appendChild(script);
  }, []);

  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">Marktmonitor</div>
      <div className="tradingview-widget-container" ref={container} style={{ height: 300 }} />
    </div>
  );
}
