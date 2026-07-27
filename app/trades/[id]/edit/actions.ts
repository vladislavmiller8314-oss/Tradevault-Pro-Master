"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateTrade(tradeId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const accountId = formData.get("accountId") as string;
  const instrument = (formData.get("instrument") as string).toUpperCase();
  const direction = formData.get("direction") as "Long" | "Short";
  const contracts = parseFloat(formData.get("contracts") as string);
  const entryPrice = parseFloat(formData.get("entryPrice") as string);
  const exitPrice = parseFloat(formData.get("exitPrice") as string);
  const stopPrice = formData.get("stopPrice") ? parseFloat(formData.get("stopPrice") as string) : null;
  const targetPrice = formData.get("targetPrice") ? parseFloat(formData.get("targetPrice") as string) : null;
  const fees = parseFloat(formData.get("fees") as string) || 0;
  const pointValue = parseFloat(formData.get("pointValue") as string) || 1;
  const setup = (formData.get("setup") as string) || null;
  const preTradeEmotion = (formData.get("preTradeEmotion") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const openedAt = formData.get("openedAt") as string;
  const closedAt = formData.get("closedAt") as string;

  if (!accountId || !instrument || !direction || !contracts || !entryPrice || !exitPrice || !openedAt || !closedAt) {
    redirect(`/trades/${tradeId}/edit?error=${encodeURIComponent("Bitte alle Pflichtfelder ausfüllen")}`);
  }

  const priceDiff = direction === "Long" ? exitPrice - entryPrice : entryPrice - exitPrice;
  const pnl = priceDiff * contracts * pointValue - fees;

  let screenshotUrl: string | null | undefined = undefined; // undefined = unverändert lassen
  const screenshot = formData.get("screenshot") as File | null;

  if (screenshot && screenshot.size > 0) {
    const ext = screenshot.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("trade-screenshots")
      .upload(path, screenshot);

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from("trade-screenshots").getPublicUrl(path);
      screenshotUrl = publicUrl.publicUrl;
    }
  }

  const updatePayload: Record<string, unknown> = {
    account_id: accountId,
    instrument,
    direction,
    contracts,
    entry_price: entryPrice,
    exit_price: exitPrice,
    stop_price: stopPrice,
    target_price: targetPrice,
    fees,
    pnl,
    setup,
    pre_trade_emotion: preTradeEmotion,
    notes,
    opened_at: new Date(openedAt).toISOString(),
    closed_at: new Date(closedAt).toISOString(),
  };

  if (screenshotUrl !== undefined) {
    updatePayload.screenshot_url = screenshotUrl;
  }

  const { error } = await supabase
    .from("trades")
    .update(updatePayload)
    .eq("id", tradeId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/trades/${tradeId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/stats");
  redirect("/journal");
}

export async function deleteTrade(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tradeId = formData.get("tradeId") as string;

  await supabase.from("trades").delete().eq("id", tradeId).eq("user_id", user.id);

  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/stats");
  revalidatePath("/replay");
}

export async function bulkDeleteTrades(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const idsRaw = (formData.get("tradeIds") as string) || "";
  const ids = idsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    redirect("/journal");
  }

  await supabase.from("trades").delete().in("id", ids).eq("user_id", user.id);

  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/stats");
  revalidatePath("/replay");
  redirect(`/journal?bulkDeleted=${ids.length}`);
}
