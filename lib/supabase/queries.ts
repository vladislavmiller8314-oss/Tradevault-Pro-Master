import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account, EquityPoint, Trade } from "@/types/trade";
import { DEFAULT_ACTIVE_WIDGETS } from "@/lib/widgets";
import type { MusicProvider } from "@/lib/music";

// Wandelt eine Zeile aus der `trades`-Tabelle (snake_case) in den
// camelCase-Typ um, den die bestehenden Dashboard-Komponenten erwarten.
function mapTrade(row: any): Trade {
  return {
    id: row.id,
    accountId: row.account_id,
    instrument: row.instrument,
    direction: row.direction,
    contracts: Number(row.contracts),
    entryPrice: Number(row.entry_price),
    exitPrice: Number(row.exit_price),
    stopPrice: row.stop_price ? Number(row.stop_price) : 0,
    targetPrice: row.target_price ? Number(row.target_price) : 0,
    fees: Number(row.fees),
    pnl: Number(row.pnl),
    setup: row.setup ?? "",
    emotion: row.emotion ?? "",
    ruleAdherence: row.rule_adherence ?? undefined,
    improvementNote: row.improvement_note ?? undefined,
    screenshotUrl: row.screenshot_url ?? undefined,
    notes: row.notes ?? undefined,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
  };
}

export async function fetchTrades(
  supabase: SupabaseClient,
  userId: string,
  limit?: number,
  accountId?: string
): Promise<Trade[]> {
  let query = supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("closed_at", { ascending: false });

  if (accountId) query = query.eq("account_id", accountId);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapTrade);
}

// Kontostand je Konto = Startkapital + Summe aller P&L-Werte auf diesem
// Konto (Tages-P&L eines Kontos = P&L der heute geschlossenen Trades).
export async function fetchAccountsWithBalances(
  supabase: SupabaseClient,
  userId: string
): Promise<(Account & { dayPl: number })[]> {
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (!accounts) return [];

  const trades = await fetchTrades(supabase, userId);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return accounts.map((a) => {
    const accountTrades = trades.filter((t) => t.accountId === a.id);
    const totalPnl = accountTrades.reduce((sum, t) => sum + t.pnl, 0);
    const dayPl = accountTrades
      .filter((t) => new Date(t.closedAt) >= startOfToday)
      .reduce((sum, t) => sum + t.pnl, 0);

    return {
      id: a.id,
      name: a.name,
      type: a.type,
      currency: a.currency,
      balance: Number(a.starting_balance) + totalPnl,
      dayPl,
    };
  });
}

// Baut eine Equity-Curve aus dem Trade-Verlauf: Startkapital aller Konten
// plus die kumulierte P&L bis zu jedem Tag, an dem mindestens ein Trade
// geschlossen wurde. Ohne Trades gibt es nur den Startpunkt.
export async function fetchEquityCurve(
  supabase: SupabaseClient,
  userId: string,
  accountId?: string
): Promise<EquityPoint[]> {
  let accountsQuery = supabase
    .from("accounts")
    .select("id, starting_balance")
    .eq("user_id", userId)
    .eq("is_archived", false);

  if (accountId) accountsQuery = accountsQuery.eq("id", accountId);

  const { data: accounts } = await accountsQuery;

  const startingTotal = (accounts ?? []).reduce(
    (sum, a) => sum + Number(a.starting_balance),
    0
  );

  const trades = await fetchTrades(supabase, userId, undefined, accountId);
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime()
  );

  const fmt = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

  if (sorted.length === 0) {
    return [{ date: fmt(new Date()), equity: startingTotal }];
  }

  const points: EquityPoint[] = [];
  let running = startingTotal;
  let lastDate = "";

  for (const t of sorted) {
    running += t.pnl;
    const dateLabel = fmt(new Date(t.closedAt));
    if (dateLabel === lastDate) {
      points[points.length - 1].equity = running;
    } else {
      points.push({ date: dateLabel, equity: running });
      lastDate = dateLabel;
    }
  }

  return points;
}

export interface Profile {
  activeWidgets: string[];
  musicProvider: MusicProvider;
  musicUrl: string | null;
}

// Liefert immer nutzbare Defaults, auch falls die Trigger-basierte
// Profil-Erstellung (siehe schema.sql) noch nicht gegriffen hat.
export async function fetchProfile(supabase: SupabaseClient, userId: string): Promise<Profile> {
  const { data } = await supabase
    .from("profiles")
    .select("active_widgets, music_provider, music_url")
    .eq("id", userId)
    .maybeSingle();

  return {
    activeWidgets: data?.active_widgets ?? DEFAULT_ACTIVE_WIDGETS,
    musicProvider: (data?.music_provider as MusicProvider) ?? "none",
    musicUrl: data?.music_url ?? null,
  };
}
