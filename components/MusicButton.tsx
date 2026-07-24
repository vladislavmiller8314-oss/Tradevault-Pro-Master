"use client";

import { useState } from "react";
import Link from "next/link";
import { Music } from "lucide-react";
import { getMusicEmbedUrl, type MusicProvider } from "@/lib/music";

export function MusicButton({
  provider,
  url,
}: {
  provider: MusicProvider;
  url: string | null;
}) {
  const [open, setOpen] = useState(false);
  const embedUrl = url ? getMusicEmbedUrl(provider, url) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Musik"
        className={`flex items-center justify-center w-9 h-9 rounded-panel border transition-colors ${
          embedUrl
            ? "border-gain/30 bg-gain/10 text-gain hover:bg-gain/20"
            : "border-panel-line text-ink-muted hover:text-ink"
        }`}
      >
        <Music size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-panel bg-panel-raised border border-panel-line shadow-instrument p-3 z-50">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                width="100%"
                height={provider === "soundcloud" ? 166 : 152}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="rounded-md"
                title="Musik-Player"
              />
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-ink-muted mb-3">
                  Noch keine Musik verknüpft.
                </p>
                <Link
                  href="/settings"
                  className="text-xs text-gain hover:underline"
                  onClick={() => setOpen(false)}
                >
                  In den Einstellungen einrichten →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
