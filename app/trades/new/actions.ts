"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTrade(formData: FormData) {
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
  // Punktwert je Kontrakt (z. B. 5 $ je Punkt bei MES) — siehe SPEZIFIKATION.md
  // Abschnitt 2, solange keine feste Instrument-Referenztabelle existiert.
  const pointValue = parseFloat(formData.get("pointValue") as string) || 1;
  const setup = (formData.get("setup") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const openedAt = formData.get("openedAt") as string;
  const closedAt = formData.get("closedAt") as string;

  if (!accountId || !instrument || !direction || !contracts || !entryPrice || !exitPrice || !openedAt || !closedAt) {
    redirect(`/trades/new?error=${encodeURIComponent("Bitte alle Pflichtfelder ausfüllen")}`);
  }

  const priceDiff = direction === "Long" ? exitPrice - entryPrice : entryPrice - exitPrice;
  const pnl = priceDiff * contracts * pointValue - fees;

  let screenshotUrl: string | null = null;
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
    // Schlägt der Upload fehl, wird der Trade trotzdem gespeichert — nur ohne Screenshot.
  }

  const { data: inserted, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
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
      notes,
      screenshot_url: screenshotUrl,
      opened_at: new Date(openedAt).toISOString(),
      closed_at: new Date(closedAt).toISOString(),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect(`/trades/new?error=${encodeURIComponent(error?.message ?? "Speichern fehlgeschlagen")}`);
  }

  revalidatePath("/");
  revalidatePath("/journal");
  // Weiter zur ~15-Sekunden-Reflexion (Emotion, Regeleinhaltung, Verbesserung)
  // statt direkt ins Journal — kann dort übersprungen werden.
  redirect(`/trades/${inserted.id}/reflect`);
}
