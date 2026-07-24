"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addHighlight(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tradeId = formData.get("tradeId") as string;
  const category = formData.get("category") as "hall_of_fame" | "hall_of_shame";

  await supabase.from("trade_highlights").insert({
    user_id: user.id,
    trade_id: tradeId,
    category,
  });

  revalidatePath("/replay");
  revalidatePath("/journal");
  redirect("/replay");
}

export async function removeHighlight(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const highlightId = formData.get("highlightId") as string;

  await supabase.from("trade_highlights").delete().eq("id", highlightId).eq("user_id", user.id);

  revalidatePath("/replay");
}
