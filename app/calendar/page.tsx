import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile, fetchTrades } from "@/lib/supabase/queries";

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [trades, profile] = await Promise.all([
    fetchTrades(supabase, user.id),
    fetchProfile(supabase, user.id),
  ]);

  const now = new Date();
  const year = parseInt(searchParams.year || "", 10) || now.getFullYear();
  const month = parseInt(searchParams.month || "", 10) || now.getMonth() + 1; // 1-12

  // Tages-P&L aufsummieren: "YYYY-MM-DD" -> { pnl, count }
  const dayMap = new Map<string, { pnl: number; count: number }>();
  trades.forEach((t) => {
    const key = dayKey(new Date(t.closedAt));
    const entry = dayMap.get(key) ?? { pnl: 0, count: 0 };
    entry.pnl += t.pnl;
    entry.count += 1;
    dayMap.set(key, entry);
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Montag = 0

  const cells: ({ day: number; key: string } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  let monthPnl = 0;
  let tradingDays = 0;
  let maxAbs = 1;
  cells.forEach((c) => {
    if (!c) return;
    const entry = dayMap.get(c.key);
    if (entry) {
      monthPnl += entry.pnl;
      tradingDays += 1;
      maxAbs = Math.max(maxAbs, Math.abs(entry.pnl));
    }
  });

  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  const todayKey = dayKey(now);
  const shellProps = { userEmail: user.email, musicLinks: profile.musicLinks };

  return (
    <AppShell {...shellProps}>
      <div className="p-6 max-w-3xl">
        <div className="text-xs uppercase tracking-wider text-ink-muted mb-1">Profit-Kalender</div>
        <p className="text-sm text-ink-muted mb-4">
          Auf einen Blick: welcher Tag wie viel Gewinn oder Verlust gebracht hat.
        </p>

        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/calendar?year=${prevYear}&month=${prevMonth}`}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            ← Vorheriger Monat
          </Link>
          <div className="text-lg font-semibold text-ink">
            {MONTH_NAMES[month - 1]} {year}
          </div>
          <Link
            href={`/calendar?year=${nextYear}&month=${nextMonth}`}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Nächster Monat →
          </Link>
        </div>

        <div className="rounded-panel bg-panel-raised border border-panel-line p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-faint">Monats-P&L</div>
            <div className={`tabular text-2xl font-bold ${monthPnl >= 0 ? "text-gain" : "text-loss"}`}>
              {monthPnl >= 0 ? "+" : ""}
              {monthPnl.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-ink-faint">Handelstage</div>
            <div className="tabular text-2xl font-bold text-ink">{tradingDays}</div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="text-center text-[10px] text-ink-faint uppercase py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;

            const entry = dayMap.get(c.key);
            const pnl = entry?.pnl ?? null;
            const isToday = c.key === todayKey;
            const bgStyle =
              pnl !== null
                ? {
                    backgroundColor:
                      pnl >= 0
                        ? `rgba(0, 200, 83, ${0.12 + Math.min(1, Math.abs(pnl) / maxAbs) * 0.35})`
                        : `rgba(211, 47, 47, ${0.12 + Math.min(1, Math.abs(pnl) / maxAbs) * 0.35})`,
                  }
                : undefined;

            return (
              <div
                key={i}
                style={bgStyle}
                className={`aspect-square rounded-md border p-1.5 flex flex-col justify-between ${
                  pnl !== null ? "border-transparent" : "border-panel-line bg-panel-inset"
                } ${isToday ? "ring-1 ring-gain" : ""}`}
              >
                <span className="text-[11px] text-ink-muted">{c.day}</span>
                {pnl !== null && (
                  <span
                    className={`tabular text-[11px] font-semibold ${pnl >= 0 ? "text-gain" : "text-loss"}`}
                  >
                    {pnl >= 0 ? "+" : ""}
                    {Math.round(pnl)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {trades.length === 0 && (
          <div className="mt-6 rounded-panel bg-panel-raised border border-panel-line p-8 text-center text-sm text-ink-muted">
            Noch keine Trades erfasst — der Kalender füllt sich, sobald
            welche vorhanden sind.
          </div>
        )}
      </div>
    </AppShell>
  );
}
