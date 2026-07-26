"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WIDGET_CATALOG } from "@/lib/widgets";
import { getMusicEmbedUrl, isShortLink, type MusicProvider } from "@/lib/music";

// Löst Kurzlinks wie spotify.link/... serverseitig auf, indem der
// Redirect-Zielort abgefragt wird — im Browser geht das wegen CORS nicht.
async function resolveShareLink(url: string): Promise<string> {
  if (!isShortLink(url)) return url;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.url || url;
  } catch {
    return url;
  }
}

export async function saveWidgetPreferences(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const activeWidgets = WIDGET_CATALOG.filter((w) => formData.get(`widget_${w.key}`) === "on").map(
    (w) => w.key
  );

  await supabase
    .from("profiles")
    .upsert({ id: user.id, active_widgets: activeWidgets }, { onConflict: "id" });

  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/settings");
}

export async function saveMusicPreference(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const musicProvider = ((formData.get("musicProvider") as string) || "none") as MusicProvider;
  let musicUrl = (formData.get("musicUrl") as string) || null;

  if (musicProvider !== "none" && musicUrl) {
    musicUrl = await resolveShareLink(musicUrl);

    if (!getMusicEmbedUrl(musicProvider, musicUrl)) {
      redirect(
        `/settings?musicError=${encodeURIComponent(
          "Dieser Link wurde nicht erkannt. Bitte den vollständigen Link von der Track- oder Playlist-Seite einfügen (z. B. open.spotify.com/...)."
        )}`
      );
    }
  }

  await supabase
    .from("profiles")
    .upsert({ id: user.id, music_provider: musicProvider, music_url: musicUrl }, { onConflict: "id" });

  revalidatePath("/", "layout");
  redirect("/settings?musicSaved=1");
}
