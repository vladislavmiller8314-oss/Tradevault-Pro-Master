export interface WidgetDef {
  key: string;
  label: string;
}

export const WIDGET_CATALOG: WidgetDef[] = [
  { key: "balance", label: "Kontostand" },
  { key: "pnl", label: "Tages-P&L" },
  { key: "winrate", label: "Winrate" },
  { key: "profit_factor", label: "Profit Factor" },
  { key: "equity_curve", label: "Equity Curve" },
  { key: "recent_trades", label: "Letzte Trades" },
  { key: "accounts_overview", label: "Kontenübersicht" },
  { key: "market_monitor", label: "Marktmonitor (TradingView)" },
  { key: "economic_calendar", label: "Wirtschaftskalender (Investing.com)" },
];

export const DEFAULT_ACTIVE_WIDGETS = WIDGET_CATALOG.map((w) => w.key);
