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

  const emotion = (formData.get("emotion") as string) || null;
  const ruleAdherence = (formData.get("ruleAdherence") as string) || null;
  const setup = (formData.get("setup") as string) || null;
  const improvementNote = (formData.get("improvementNote") as string) || null;

  // RLS sorgt zusätzlich dafür, dass nur der eigene Trade aktualisiert wird.
  await supabase
    .from("trades")
    .update({
      emotion,
      rule_adherence: ruleAdherence,
      setup,
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
