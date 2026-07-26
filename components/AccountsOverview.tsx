import { clsx } from "clsx";
import type { Account } from "@/types/trade";

const typeColor: Record<Account["type"], string> = {
  Prop: "text-accent-amber",
  Live: "text-gain",
  Demo: "text-ink-muted",
  Evaluation: "text-accent-amber",
};

export function AccountsOverview({
  accounts,
}: {
  accounts: (Account & { dayPl?: number })[];
}) {
  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">Kontenübersicht</div>
      <div className="space-y-2">
        {accounts.map((a) => (
          <div key={a.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{a.name}</div>
              <div className={clsx("text-xs", typeColor[a.type])}>{a.type}</div>
            </div>
            <div className="text-right">
              <div className="tabular text-sm font-semibold text-ink">
                {a.balance.toLocaleString("de-DE", { style: "currency", currency: a.currency })}
              </div>
              {a.dayPl !== undefined && (
                <div className={clsx("tabular text-xs", a.dayPl >= 0 ? "text-gain" : "text-loss")}>
                  {a.dayPl >= 0 ? "+" : ""}
                  {a.dayPl.toLocaleString("de-DE", { style: "currency", currency: a.currency })} heute
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
