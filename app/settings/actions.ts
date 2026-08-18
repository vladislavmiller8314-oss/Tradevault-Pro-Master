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

export async function addMusicLink(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const provider = (formData.get("musicProvider") as string) as MusicProvider;
  let url = ((formData.get("musicUrl") as string) || "").trim();
  const label = ((formData.get("musicLabel") as string) || "").trim().slice(0, 60) || null;

  if (!provider || !url) {
    redirect(`/settings?musicError=${encodeURIComponent("Bitte Anbieter und Link angeben")}`);
  }

  const { count } = await supabase
    .from("music_links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 15) {
    redirect(`/settings?musicError=${encodeURIComponent("Maximal 15 Links — bitte erst welche entfernen")}`);
  }

  url = await resolveShareLink(url);

  if (!getMusicEmbedUrl(provider, url)) {
    redirect(
      `/settings?musicError=${encodeURIComponent(
        "Dieser Link wurde nicht erkannt. Bitte den vollständigen Link von der Track- oder Playlist-Seite einfügen (z. B. open.spotify.com/...)."
      )}`
    );
  }

  const { error } = await supabase.from("music_links").insert({ user_id: user.id, provider, url, label });

  if (error) {
    redirect(`/settings?musicError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/settings?musicSaved=1");
}

export async function removeMusicLink(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const linkId = formData.get("linkId") as string;

  await supabase.from("music_links").delete().eq("id", linkId).eq("user_id", user.id);

  revalidatePath("/", "layout");
  redirect("/settings?musicRemoved=1");
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

export async function saveTradingRules(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const raw = (formData.get("tradingRules") as string) || "";
  const rules = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30); // Sicherheitsgrenze, damit das Widget nicht ausufert

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, trading_rules: rules }, { onConflict: "id" });

  if (error) {
    redirect(`/settings?rulesError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  redirect(`/settings?rulesSaved=1&rulesCount=${rules.length}`);
}

export async function saveStrategies(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const raw = (formData.get("strategies") as string) || "";
  const strategies = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30); // Sicherheitsgrenze, damit das Widget nicht ausufert

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, strategies }, { onConflict: "id" });

  if (error) {
    redirect(`/settings?strategiesError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  redirect(`/settings?strategiesSaved=1&strategiesCount=${strategies.length}`);
}
