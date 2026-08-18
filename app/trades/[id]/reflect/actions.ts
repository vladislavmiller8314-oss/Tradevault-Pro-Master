"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveReflection(tradeId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const customEmotion = ((formData.get("customEmotion") as string) || "").trim().slice(0, 40);
  const emotion = customEmotion || (formData.get("emotion") as string) || null;
  const ruleAdherence = (formData.get("ruleAdherence") as string) || null;
  const strategyTags = formData.getAll("strategyTags") as string[];
  const improvementNote = (formData.get("improvementNote") as string) || null;

  // RLS sorgt zusätzlich dafür, dass nur der eigene Trade aktualisiert wird.
  // "setup" wird hier bewusst NICHT angefasst — das Feld wird woanders
  // gepflegt (Erfassen/Bearbeiten) und soll beim Reflektieren nicht
  // versehentlich auf leer überschrieben werden.
  await supabase
    .from("trades")
    .update({
      emotion,
      rule_adherence: ruleAdherence,
      strategy_tags: strategyTags,
      improvement_note: improvementNote,
    })
    .eq("id", tradeId)
    .eq("user_id", user.id);

  revalidatePath("/journal");
  revalidatePath("/");
  redirect("/journal");
}

export async function skipReflection() {
  redirect("/journal");
}
