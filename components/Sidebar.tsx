"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { signOut } from "@/app/login/actions";

export function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 border-r border-panel-line bg-panel-raised/40 flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5">
        <Image src="/logo.png" alt="TradeVault Pro" width={28} height={28} className="rounded-md" />
        <span className="font-semibold tracking-tight text-sm">TradeVault Pro</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-gain/10 text-gain border border-gain/20"
                  : "text-ink-muted hover:text-ink hover:bg-panel/60 border border-transparent"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <Link
          href="/help"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
            pathname.startsWith("/help")
              ? "bg-gain/10 text-gain border border-gain/20"
              : "text-ink-muted hover:text-ink hover:bg-panel/60 border border-transparent"
          }`}
        >
          <HelpCircle size={16} />
          Handbuch
        </Link>
      </div>

      {userEmail && (
        <div className="px-5 py-4 border-t border-panel-line">
          <div className="text-xs text-ink-faint truncate mb-2">{userEmail}</div>
          <form action={signOut}>
            <button type="submit" className="text-xs text-ink-muted hover:text-ink transition-colors">
              Abmelden
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
