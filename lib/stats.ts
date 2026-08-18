import type { Trade } from "@/types/trade";

export interface StatsRow {
  name: string;
  count: number;
  winrate: number;
  avgPnl: number;
  totalPnl: number;
}

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// Wie groupBy, aber ein Element kann zu mehreren Gruppen GLEICHZEITIG
// gehören (z.B. ein Trade mit mehreren Strategien-Tags) — zählt dann
// voll in jeder betroffenen Gruppe mit, statt aufgeteilt zu werden.
export function groupByMulti<T>(items: T[], tagsFn: (item: T) => string[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const tags = tagsFn(item);
    tags.forEach((tag) => {
      (acc[tag] ??= []).push(item);
    });
    return acc;
  }, {} as Record<string, T[]>);
}

// Sortiert absteigend nach Gesamt-P&L — für Instrument/Setup/Konto, wo die
// Reihenfolge selbst eine Aussage ist (bester zuerst).
export function toStatsRows(groups: Record<string, Trade[]>): StatsRow[] {
  return Object.entries(groups)
    .map(([name, trades]) => {
      const wins = trades.filter((t) => t.pnl > 0).length;
      const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
      return {
        name,
        count: trades.length,
        winrate: trades.length ? Math.round((wins / trades.length) * 100) : 0,
        avgPnl: trades.length ? totalPnl / trades.length : 0,
        totalPnl,
      };
    })
    .sort((a, b) => b.totalPnl - a.totalPnl);
}

// Bringt Zeilen in eine feste, chronologische Reihenfolge (Wochentage,
// Uhrzeit-Blöcke, Regeleinhaltung) statt nach P&L zu sortieren.
export function orderRowsByFixedSequence(rows: StatsRow[], order: string[]): StatsRow[] {
  return order
    .map((name) => rows.find((r) => r.name === name))
    .filter((r): r is StatsRow => !!r);
}

export const WEEKDAY_ORDER = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];

export function weekdayLabel(date: Date): string {
  const jsDay = date.getDay(); // 0 = Sonntag
  return WEEKDAY_ORDER[(jsDay + 6) % 7];
}

const HOUR_BUCKETS: [number, number, string][] = [
  [0, 6, "00–06 Uhr"],
  [6, 9, "06–09 Uhr"],
  [9, 12, "09–12 Uhr"],
  [12, 14, "12–14 Uhr"],
  [14, 17, "14–17 Uhr"],
  [17, 20, "17–20 Uhr"],
  [20, 24, "20–24 Uhr"],
];

export const HOUR_BUCKET_ORDER = HOUR_BUCKETS.map((b) => b[2]);

export function hourBucketLabel(date: Date): string {
  const h = date.getHours();
  const bucket = HOUR_BUCKETS.find(([start, end]) => h >= start && h < end);
  return bucket ? bucket[2] : "Unbekannt";
}

export const RULE_ORDER = ["✅ Eingehalten", "⚠️ Teilweise", "❌ Gebrochen", "Nicht angegeben"];

export function ruleLabel(rule?: string): string {
  if (rule === "eingehalten") return "✅ Eingehalten";
  if (rule === "teilweise") return "⚠️ Teilweise";
  if (rule === "gebrochen") return "❌ Gebrochen";
  return "Nicht angegeben";
}
