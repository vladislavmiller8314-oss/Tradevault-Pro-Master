"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

// TradingView "Advanced Chart" Widget — kostenloses Embed, kein API-Key.
// WICHTIG, ehrlich gesagt: Das zeigt den allgemeinen Marktverlauf für das
// Instrument, NICHT deinen exakten Ein-/Ausstiegspunkt als Markierung auf
// dem Chart eingezeichnet — echtes "Kerze-für-Kerze"-Replay mit deinen
// Punkten würde TradingViews kostenpflichtige Charting-Library brauchen,
// und die vergibt TradingView laut eigener Aussage explizit nicht für
// private/Hobby-Projekte. Das hier ist der kostenlose, sofort nutzbare
// Zwischenschritt: Marktkontext ansehen (auch im Vollbild), während eine
// feste Info-Leiste dir genau sagt, wonach du Ausschau halten musst.
export function TradingViewSymbolChart({
  symbol,
  openedAt,
  closedAt,
  entryPrice,
  exitPrice,
}: {
  symbol: string;
  openedAt?: string;
  closedAt?: string;
  entryPrice?: number | string;
  exitPrice?: number | string;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = () => {
    if (!wrapper.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapper.current.requestFullscreen().catch(() => setBlocked(true));
    }
  };

  const fmt = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div
      ref={wrapper}
      className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument data-[fullscreen=true]:rounded-none data-[fullscreen=true]:h-screen data-[fullscreen=true]:flex data-[fullscreen=true]:flex-col"
      data-fullscreen={isFullscreen}
    >
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="text-xs uppercase tracking-wider text-ink-muted">Marktkontext ({symbol})</div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors rounded-md border border-panel-line px-2 py-1"
          title={isFullscreen ? "Vollbild verlassen" : "Vollbild"}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {isFullscreen ? "Vollbild verlassen" : "Vollbild"}
        </button>
      </div>

      {(fmt(openedAt) || fmt(closedAt)) && (
        <div className="mb-3 shrink-0 rounded-md bg-panel-inset border border-panel-line px-3 py-2 text-xs text-ink flex flex-wrap gap-x-5 gap-y-1">
          {fmt(openedAt) && (
            <span>
              <span className="text-ink-faint">Entry: </span>
              {fmt(openedAt)}
              {entryPrice !== undefined && <span className="text-ink-faint"> @ {entryPrice}</span>}
            </span>
          )}
          {fmt(closedAt) && (
            <span>
              <span className="text-ink-faint">Exit: </span>
              {fmt(closedAt)}
              {exitPrice !== undefined && <span className="text-ink-faint"> @ {exitPrice}</span>}
            </span>
          )}
        </div>
      )}

      {blocked && (
        <p className="text-xs text-ink-faint mb-2 shrink-0">
          Chart konnte nicht geladen werden — vermutlich blockiert ein
          Ad-/Tracking-Blocker die Verbindung zu TradingView, oder dein
          Browser erlaubt hier kein Vollbild.
        </p>
      )}
      <div
        className="tradingview-widget-container flex-1"
        ref={container}
        style={{ height: isFullscreen ? undefined : 420 }}
      />
      <p className="text-[11px] text-ink-faint mt-2 shrink-0">
        Zeigt den allgemeinen Marktverlauf, nicht deinen exakten Ein-/
        Ausstiegspunkt eingezeichnet — dafür oben die Info-Leiste mit
        genauer Zeit/Preis nutzen, um selbst im Chart zur richtigen Stelle
        zu navigieren.
      </p>
    </div>
  );
}
