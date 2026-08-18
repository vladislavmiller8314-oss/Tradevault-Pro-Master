import Link from "next/link";
import { redirect } from "next/navigation";
import { KpiCard } from "@/components/KpiCard";
import { PerformanceGauge } from "@/components/PerformanceGauge";
import { EquityCurve } from "@/components/EquityCurve";
import { RecentTrades } from "@/components/RecentTrades";
import { AccountsOverview } from "@/components/AccountsOverview";
import { TradingRulesWidget } from "@/components/TradingRulesWidget";
import { StrategyListWidget } from "@/components/StrategyListWidget";
import { TradingViewMarketOverview } from "@/components/TradingViewMarketOverview";
import { InvestingEconomicCalendar } from "@/components/InvestingEconomicCalendar";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import {
  fetchAccountsWithBalances,
  fetchEquityCurve,
  fetchProfile,
  fetchTrades,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { account?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const selectedAccountId = searchParams.account;

  const [accounts, allTrades, equity, profile] = await Promise.all([
    fetchAccountsWithBalances(supabase, user.id),
    fetchTrades(supabase, user.id, undefined, selectedAccountId),
    fetchEquityCurve(supabase, user.id, selectedAccountId),
    fetchProfile(supabase, user.id),
  ]);

  const trades = allTrades.slice(0, 5); // nur für die "Letzte Trades"-Anzeige

  const visibleAccounts = selectedAccountId
    ? accounts.filter((a) => a.id === selectedAccountId)
    : accounts;

  const on = (key: string) => profile.activeWidgets.includes(key);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaysTrades = allTrades.filter((t) => new Date(t.closedAt) >= startOfToday);

  const totalBalance = visibleAccounts.reduce((sum, a) => sum + a.balance, 0);
  const dayPnl = todaysTrades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = allTrades.filter((t) => t.pnl > 0).length;
  const winrate = allTrades.length ? Math.round((wins / allTrades.length) * 100) : 0;
  const grossWin = allTrades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(allTrades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;

  const shellProps = {
    userEmail: user.email,
    musicLinks: profile.musicLinks,
  };

  if (accounts.length === 0) {
    return (
      <AppShell {...shellProps}>
        <div className="p-6">
          <div className="max-w-md mx-auto text-center rounded-panel bg-panel-raised border border-panel-line p-8 mt-12">
            <p className="text-sm text-ink-muted mb-4">
              Willkommen bei TradeVault Pro! Lege zuerst ein Konto an, damit
              dein Dashboard mit echten Zahlen gefüllt werden kann.
            </p>
            <Link
              href="/accounts"
              className="inline-block rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
            >
              Erstes Konto anlegen
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const hasKpiRow = on("balance") || on("pnl") || on("winrate") || on("profit_factor");
  const hasHeroRow = on("equity_curve") || on("winrate") || on("profit_factor");
  const hasBottomRow =
    on("recent_trades") ||
    on("accounts_overview") ||
    on("market_monitor") ||
    on("economic_calendar") ||
    on("trading_rules") ||
    on("strategies");

  return (
    <AppShell {...shellProps}>
      <div className="p-6 space-y-6">
        {accounts.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                !selectedAccountId
                  ? "border-gain/50 bg-gain/10 text-gain"
                  : "border-panel-line bg-panel-inset text-ink-muted hover:text-ink"
              }`}
            >
              Alle Konten
            </Link>
            {accounts.map((a) => (
              <Link
                key={a.id}
                href={`/?account=${a.id}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  selectedAccountId === a.id
                    ? "border-gain/50 bg-gain/10 text-gain"
                    : "border-panel-line bg-panel-inset text-ink-muted hover:text-ink"
                }`}
              >
                {a.name}
              </Link>
            ))}
          </div>
        )}

        {hasKpiRow && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {on("balance") && (
              <KpiCard
                label="Kontostand"
                value={totalBalance.toLocaleString("de-DE", { style: "currency", currency: "USD" })}
              />
            )}
            {on("pnl") && (
              <KpiCard
                label="Tages-P&L"
                value={`${dayPnl >= 0 ? "+" : ""}${dayPnl.toFixed(2)} $`}
                tone={dayPnl >= 0 ? "gain" : "loss"}
              />
            )}
            <KpiCard label="Trades heute" value={String(todaysTrades.length)} />
            <KpiCard
              label="Gebühren heute"
              value={`${todaysTrades.reduce((s, t) => s + t.fees, 0).toFixed(2)} $`}
            />
          </div>
        )}

        {hasHeroRow && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {on("equity_curve") && (
              <div className="lg:col-span-2">
                <EquityCurve data={equity} />
              </div>
            )}
            {(on("winrate") || on("profit_factor")) && (
              <div className={`grid grid-cols-2 gap-4 ${on("equity_curve") ? "" : "lg:col-span-3"}`}>
                {on("winrate") && (
                  <PerformanceGauge label="Winrate" value={winrate} displayValue={`${winrate}%`} redline={50} />
                )}
                {on("profit_factor") && (
                  <PerformanceGauge
                    label="Profit Factor"
                    value={Math.min(profitFactor * 33.3, 100)}
                    displayValue={profitFactor.toFixed(2)}
                    redline={33}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {hasBottomRow && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {on("recent_trades") &&
              (trades.length > 0 ? (
                <RecentTrades trades={trades} />
              ) : (
                <div className="rounded-panel bg-panel-raised border border-panel-line p-6 text-center">
                  <p className="text-sm text-ink-muted mb-3">Noch keine Trades erfasst.</p>
                  <Link href="/trades/new" className="text-sm text-gain hover:underline">
                    Ersten Trade erfassen →
                  </Link>
                </div>
              ))}
            {on("accounts_overview") && <AccountsOverview accounts={visibleAccounts} />}
            {(on("market_monitor") || on("economic_calendar") || on("trading_rules") || on("strategies")) && (
              <div className="space-y-4">
                {on("trading_rules") && <TradingRulesWidget rules={profile.tradingRules} />}
                {on("strategies") && <StrategyListWidget strategies={profile.strategies} />}
                {on("market_monitor") && <TradingViewMarketOverview />}
                {on("economic_calendar") && <InvestingEconomicCalendar />}
              </div>
            )}
          </div>
        )}

        {!hasKpiRow && !hasHeroRow && !hasBottomRow && (
          <div className="max-w-md mx-auto text-center rounded-panel bg-panel-raised border border-panel-line p-8 mt-8">
            <p className="text-sm text-ink-muted mb-4">
              Alle Dashboard-Widgets sind ausgeblendet.
            </p>
            <Link href="/settings" className="text-sm text-gain hover:underline">
              In den Einstellungen wieder aktivieren →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
