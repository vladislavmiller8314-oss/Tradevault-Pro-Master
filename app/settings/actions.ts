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

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, active_widgets: activeWidgets }, { onConflict: "id" });

  if (error) {
    redirect(`/settings?widgetError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/settings?widgetSaved=1");
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

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, music_provider: musicProvider, music_url: musicUrl }, { onConflict: "id" });

  if (error) {
    redirect(`/settings?musicError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/settings?musicSaved=1");
}

export async function saveLeaderboardPreference(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const optIn = formData.get("leaderboardOptIn") === "on";
  const displayName = ((formData.get("leaderboardDisplayName") as string) || "").trim().slice(0, 40) || null;

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, leaderboard_opt_in: optIn, leaderboard_display_name: displayName },
      { onConflict: "id" }
    );

  if (error) {
    redirect(`/settings?leaderboardError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/leaderboard");
  revalidatePath("/settings");
  redirect("/settings?leaderboardSaved=1");
}
