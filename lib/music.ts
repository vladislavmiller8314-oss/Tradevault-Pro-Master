export type MusicProvider = "spotify" | "apple_music" | "youtube_music" | "soundcloud" | "none";

// Wandelt einen normalen, von Nutzern eingefügten Link in die jeweilige
// Embed-URL des Anbieters um. Alle vier funktionieren ohne OAuth/Login —
// es wird nur der öffentliche Player eingebettet, kein eigenes Konto
// verknüpft.
export function getMusicEmbedUrl(provider: MusicProvider, url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  try {
    switch (provider) {
      case "spotify": {
        // https://open.spotify.com/track/... oder /playlist/... oder /album/...
        if (!trimmed.includes("open.spotify.com/")) return null;
        return trimmed.replace("open.spotify.com/", "open.spotify.com/embed/").split("?")[0];
      }
      case "apple_music": {
        // https://music.apple.com/...
        if (!trimmed.includes("music.apple.com/")) return null;
        return trimmed.replace("music.apple.com/", "embed.music.apple.com/");
      }
      case "youtube_music": {
        // youtube.com/watch?v=, youtu.be/, music.youtube.com/watch?v=, oder Playlist mit list=
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
        if (!trimmed.includes("soundcloud.com/")) return null;
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&color=%2300c853&auto_play=false&show_teaser=false`;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export const MUSIC_PROVIDERS: { value: MusicProvider; label: string; placeholder: string }[] = [
  { value: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/playlist/..." },
  { value: "apple_music", label: "Apple Music", placeholder: "https://music.apple.com/..." },
  { value: "youtube_music", label: "YouTube Music", placeholder: "https://music.youtube.com/watch?v=..." },
  { value: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/..." },
];
