"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WIDGET_CATALOG } from "@/lib/widgets";

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

  const musicProvider = (formData.get("musicProvider") as string) || "none";
  const musicUrl = (formData.get("musicUrl") as string) || null;

  await supabase
    .from("profiles")
    .upsert({ id: user.id, music_provider: musicProvider, music_url: musicUrl }, { onConflict: "id" });

  revalidatePath("/", "layout");
  redirect("/settings");
}
