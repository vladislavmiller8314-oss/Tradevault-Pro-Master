import Image from "next/image";
import { Skeleton } from "./Skeleton";

const NAV_LABELS = ["Dashboard", "Journal", "Replay", "Statistiken", "Konten", "Einstellungen"];

export function ShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-60 shrink-0 border-r border-panel-line bg-panel-raised/40 flex-col h-screen sticky top-0">
        <div className="flex items-center gap-2 px-5 py-5">
          <Image src="/logo.png" alt="TradeVault Pro" width={28} height={28} className="rounded-md" />
          <span className="font-semibold tracking-tight text-sm">TradeVault Pro</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_LABELS.map((label) => (
            <div key={label} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-faint">
              <Skeleton className="w-4 h-4" />
              {label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 pb-16 md:pb-0">
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-b border-panel-line">
          <Skeleton className="w-9 h-9" />
          <Skeleton className="w-32 h-9" />
        </div>
        {children}
      </div>
    </div>
  );
}
