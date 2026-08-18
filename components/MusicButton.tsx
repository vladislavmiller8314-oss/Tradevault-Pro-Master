"use client";

import { useState } from "react";
import Link from "next/link";
import { Music, ChevronLeft } from "lucide-react";
import { getMusicEmbedUrl, MUSIC_PROVIDERS, type MusicProvider } from "@/lib/music";

interface MusicLink {
  id: string;
  provider: MusicProvider;
  url: string;
  label: string | null;
}

function providerLabel(provider: MusicProvider): string {
  return MUSIC_PROVIDERS.find((p) => p.value === provider)?.label ?? provider;
}

export function MusicButton({ links }: { links: MusicLink[] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = links.find((l) => l.id === activeId) ?? null;
  const embedUrl = active ? getMusicEmbedUrl(active.provider, active.url) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Musik"
        className={`flex items-center justify-center w-9 h-9 rounded-panel border transition-colors ${
          links.length > 0
            ? "border-gain/30 bg-gain/10 text-gain hover:bg-gain/20"
            : "border-panel-line text-ink-muted hover:text-ink"
        }`}
      >
        <Music size={16} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setActiveId(null);
            }}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-panel bg-panel-raised border border-panel-line shadow-instrument p-3 z-50">
            {links.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-ink-muted mb-3">Noch keine Musik verknüpft.</p>
                <Link
                  href="/settings"
                  className="text-xs text-gain hover:underline"
                  onClick={() => setOpen(false)}
                >
                  In den Einstellungen einrichten →
                </Link>
              </div>
            ) : active && embedUrl ? (
              <div>
                <button
                  onClick={() => setActiveId(null)}
                  className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2 transition-colors"
                >
                  <ChevronLeft size={13} />
                  Liste
                </button>
                <iframe
                  src={embedUrl}
                  width="100%"
                  height={active.provider === "soundcloud" ? 166 : 152}
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  className="rounded-md"
                  title="Musik-Player"
                />
              </div>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {links.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setActiveId(l.id)}
                    className="w-full flex items-center justify-between rounded-md px-3 py-2.5 text-left bg-panel-inset border border-panel-line hover:border-gain/40 transition-colors"
                  >
                    <span className="text-sm text-ink truncate">{l.label || providerLabel(l.provider)}</span>
                    <span className="text-[10px] text-ink-faint uppercase shrink-0 ml-2">
                      {providerLabel(l.provider)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
