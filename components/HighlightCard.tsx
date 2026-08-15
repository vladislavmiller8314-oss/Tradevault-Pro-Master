import { clsx } from "clsx";
import Link from "next/link";
import type { Trade } from "@/types/trade";
import { removeHighlight } from "@/app/replay/actions";

interface Highlight {
  id: string;
  comment: string | null;
  trade: Trade;
}

export function HighlightCard({ highlight }: { highlight: Highlight }) {
  const t = highlight.trade;

  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4">
      <div className="flex items-center justify-between mb-2">
        <Link href={`/trades/${t.id}`} className="text-sm font-semibold hover:underline">
          {t.instrument} · <span className={t.direction === "Long" ? "text-gain" : "text-loss"}>{t.direction}</span>
        </Link>
        <span className={clsx("tabular text-sm font-semibold", t.pnl >= 0 ? "text-gain" : "text-loss")}>
          {t.pnl >= 0 ? "+" : ""}
          {t.pnl.toFixed(2)} $
        </span>
      </div>

      {t.screenshotUrl && (
        <Link href={`/trades/${t.id}`} className="block mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={t.screenshotUrl}
            alt={`Screenshot ${t.instrument}`}
            className="rounded-md border border-panel-line max-h-32 w-full object-cover"
          />
        </Link>
      )}

      <div className="text-xs text-ink-faint mb-2">
        {new Date(t.closedAt).toLocaleDateString("de-DE")}
        {t.setup ? ` · ${t.setup}` : ""}
      </div>

      {t.improvementNote && (
        <p className="text-xs text-ink-muted italic mb-2">„{t.improvementNote}"</p>
      )}

      <form action={removeHighlight}>
        <input type="hidden" name="highlightId" value={highlight.id} />
        <button type="submit" className="text-xs text-ink-faint hover:text-loss transition-colors">
          Entfernen
        </button>
      </form>
    </div>
  );
}
