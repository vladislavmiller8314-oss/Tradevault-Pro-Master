"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, HelpCircle } from "lucide-react";
import { NAV } from "@/lib/nav";
import { signOut } from "@/app/login/actions";

const PRIMARY = NAV.slice(0, 4); // Dashboard, Journal, Replay, Statistiken
const MORE = NAV.slice(4); // Kalender, Coach, Konten, Rangliste, Einstellungen (+ Handbuch, Abmelden)

export function MobileBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const moreActive = MORE.some((n) => isActive(n.href)) || pathname.startsWith("/help");

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-panel-raised/95 backdrop-blur border-t border-panel-line pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {PRIMARY.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                isActive(href) ? "text-gain" : "text-ink-faint"
              }`}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
          <button
            onClick={() => setOpen(true)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
              moreActive ? "text-gain" : "text-ink-faint"
            }`}
          >
            <MoreHorizontal size={19} />
            Mehr
          </button>
        </div>
      </nav>

      {open && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/55 z-40" onClick={() => setOpen(false)} />
          <div className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-panel-raised border-t border-panel-line rounded-t-2xl p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <div className="w-9 h-1 rounded-full bg-panel-line mx-auto mb-4" />
            <div className="grid grid-cols-3 gap-2">
              {MORE.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-xs ${
                    isActive(href)
                      ? "border-gain/30 bg-gain/10 text-gain"
                      : "border-panel-line bg-panel-inset text-ink-muted"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
              <Link
                href="/help"
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-xs ${
                  pathname.startsWith("/help")
                    ? "border-gain/30 bg-gain/10 text-gain"
                    : "border-panel-line bg-panel-inset text-ink-muted"
                }`}
              >
                <HelpCircle size={18} />
                Handbuch
              </Link>
            </div>
            <form action={signOut} className="mt-3">
              <button type="submit" className="w-full text-center text-xs text-ink-faint py-2">
                Abmelden
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
