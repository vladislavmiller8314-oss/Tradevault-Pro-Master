import { clsx } from "clsx";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  tone?: "gain" | "loss" | "neutral";
}

export function KpiCard({ label, value, delta, tone = "neutral" }: KpiCardProps) {
  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="text-xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div
        className={clsx("tabular mt-1 text-2xl font-semibold", {
          "text-gain": tone === "gain",
          "text-loss": tone === "loss",
          "text-ink": tone === "neutral",
        })}
      >
        {value}
      </div>
      {delta && (
        <div
          className={clsx("tabular mt-1 text-xs", {
            "text-gain": tone === "gain",
            "text-loss": tone === "loss",
            "text-ink-faint": tone === "neutral",
          })}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
