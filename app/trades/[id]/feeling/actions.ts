"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveFeelingBefore(tradeId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const preTradeEmotion = (formData.get("preTradeEmotion") as string) || null;

  await supabase
    .from("trades")
    .update({ pre_trade_emotion: preTradeEmotion })
    .eq("id", tradeId)
    .eq("user_id", user.id);

  redirect(`/trades/${tradeId}/reflect`);
}

export async function skipFeelingBefore(tradeId: string, _formData: FormData) {
  redirect(`/trades/${tradeId}/reflect`);
}
