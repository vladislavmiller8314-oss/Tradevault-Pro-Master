export type MusicProvider = "spotify" | "apple_music" | "youtube_music" | "soundcloud" | "none";

// Domains, unter denen Anbieter kurze "Teilen"-Links ausgeben (z. B. aus der
// mobilen App heraus). Diese leiten per Redirect auf die eigentliche URL um
// und müssen serverseitig aufgelöst werden, bevor sie sich einbetten lassen
// (siehe resolveShareLink in app/settings/actions.ts).
export const SHORT_LINK_HOSTS = ["spotify.link", "spoti.fi", "on.soundcloud.com"];

function normalize(url: string): string {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  return u;
}

export function isShortLink(url: string): boolean {
  try {
    const host = new URL(normalize(url)).hostname.replace(/^www\./, "");
    return SHORT_LINK_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

// Wandelt einen normalen, von Nutzern eingefügten Link in die jeweilige
// Embed-URL des Anbieters um. Alle vier funktionieren ohne OAuth/Login —
// es wird nur der öffentliche Player eingebettet, kein eigenes Konto
// verknüpft. Erwartet bereits eine aufgelöste (nicht verkürzte) URL.
export function getMusicEmbedUrl(provider: MusicProvider, url: string): string | null {
  if (!url) return null;
  const trimmed = normalize(url);

  try {
    switch (provider) {
      case "spotify": {
        // https://open.spotify.com/track/... , /playlist/... , /album/...
        // auch mit Locale-Präfix wie /intl-de/playlist/...
        if (!/open\.spotify\.com\//i.test(trimmed)) return null;
        return trimmed.replace(/open\.spotify\.com\//i, "open.spotify.com/embed/").split("?")[0];
      }
      case "apple_music": {
        if (!/music\.apple\.com\//i.test(trimmed)) return null;
        return trimmed.replace(/music\.apple\.com\//i, "embed.music.apple.com/");
      }
      case "youtube_music": {
        const u = new URL(trimmed);
        const videoId = u.searchParams.get("v");
        const playlistId = u.searchParams.get("list");
        if (u.hostname.includes("youtu.be")) {
          const id = u.pathname.replace("/", "");
          return `https://www.youtube.com/embed/${id}`;
        }
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        if (playlistId) return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
        return null;
      }
      case "soundcloud": {
        if (!/soundcloud\.com\//i.test(trimmed)) return null;
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&color=%2300c853&auto_play=false&show_teaser=false`;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export const MUSIC_PROVIDERS: { value: MusicProvider; label: string; placeholder: string; hint: string }[] = [
  {
    value: "spotify",
    label: "Spotify",
    placeholder: "https://open.spotify.com/playlist/...",
    hint: "In Spotify auf „Teilen” → „Link kopieren” — kurze spotify.link-Links funktionieren auch.",
  },
  {
    value: "apple_music",
    label: "Apple Music",
    placeholder: "https://music.apple.com/...",
    hint: "In Apple Music auf „Teilen” → „Link kopieren”.",
  },
  {
    value: "youtube_music",
    label: "YouTube Music",
    placeholder: "https://music.youtube.com/watch?v=...",
    hint: "Funktioniert mit normalen YouTube- und YouTube-Music-Links.",
  },
  {
    value: "soundcloud",
    label: "SoundCloud",
    placeholder: "https://soundcloud.com/...",
    hint: "Der volle Link von der Track- oder Playlist-Seite.",
  },
];
