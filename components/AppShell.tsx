import Link from "next/link";
import { Plus } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MusicButton } from "@/components/MusicButton";
import type { MusicProvider } from "@/lib/music";

export function AppShell({
  userEmail,
  musicProvider = "none",
  musicUrl = null,
  children,
}: {
  userEmail?: string;
  musicProvider?: MusicProvider;
  musicUrl?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-b border-panel-line">
          <MusicButton provider={musicProvider} url={musicUrl} />
          <Link
            href="/trades/new"
            className="flex items-center gap-2 rounded-panel bg-gain/10 border border-gain/30 px-4 py-2 text-sm font-medium text-gain hover:bg-gain/20 transition-colors"
          >
            <Plus size={16} />
            Neuer Trade
          </Link>
        </div>
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}
