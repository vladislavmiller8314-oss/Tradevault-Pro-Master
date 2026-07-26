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
  const entryPrice = parseFloat(formData.get("entryPrice") as string);
  const stopPrice = formData.get("stopPrice") ? parseFloat(formData.get("stopPrice") as string) : null;
  const targetPrice = formData.get("targetPrice") ? parseFloat(formData.get("targetPrice") as string) : null;
  const totalFees = parseFloat(formData.get("fees") as string) || 0;
  // Punktwert je Kontrakt (z. B. 5 $ je Punkt bei MES) — siehe SPEZIFIKATION.md
  // Abschnitt 2, solange keine feste Instrument-Referenztabelle existiert.
  const pointValue = parseFloat(formData.get("pointValue") as string) || 1;
  const setup = (formData.get("setup") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const openedAt = formData.get("openedAt") as string;

  const legCount = parseInt((formData.get("legCount") as string) || "1", 10);
  const legs: { contracts: number; exitPrice: number; closedAt: string }[] = [];

  for (let i = 0; i < legCount; i++) {
    const contracts = parseFloat(formData.get(`legContracts_${i}`) as string);
    const exitPrice = parseFloat(formData.get(`legExitPrice_${i}`) as string);
    const closedAt = formData.get(`legClosedAt_${i}`) as string;
    if (contracts > 0 && exitPrice > 0 && closedAt) {
      legs.push({ contracts, exitPrice, closedAt });
    }
  }

  if (!accountId || !instrument || !direction || !entryPrice || !openedAt || legs.length === 0) {
    redirect(`/trades/new?error=${encodeURIComponent("Bitte alle Pflichtfelder ausfüllen")}`);
  }

  const totalContracts = legs.reduce((sum, l) => sum + l.contracts, 0);

  let screenshotUrl: string | null = null;
  const screenshot = formData.get("screenshot") as File | null;

  if (screenshot && screenshot.size > 0) {
    const ext = screenshot.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("trade-screenshots").upload(path, screenshot);

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from("trade-screenshots").getPublicUrl(path);
      screenshotUrl = publicUrl.publicUrl;
    }
    // Schlägt der Upload fehl, wird der Trade trotzdem gespeichert — nur ohne Screenshot.
  }

  const rowsToInsert = legs.map((leg) => {
    const priceDiff = direction === "Long" ? leg.exitPrice - entryPrice : entryPrice - leg.exitPrice;
    // Gebühren anteilig nach Kontraktzahl dieses Ausstiegs an der Gesamtposition.
    const legFees = totalFees * (leg.contracts / totalContracts);
    const pnl = priceDiff * leg.contracts * pointValue - legFees;

    return {
      user_id: user.id,
      account_id: accountId,
      instrument,
      direction,
      contracts: leg.contracts,
      entry_price: entryPrice,
      exit_price: leg.exitPrice,
      stop_price: stopPrice,
      target_price: targetPrice,
      fees: legFees,
      pnl,
      setup,
      notes,
      screenshot_url: screenshotUrl,
      opened_at: new Date(openedAt).toISOString(),
      closed_at: new Date(leg.closedAt).toISOString(),
    };
  });

  const { data: inserted, error } = await supabase.from("trades").insert(rowsToInsert).select("id");

  if (error || !inserted || inserted.length === 0) {
    redirect(`/trades/new?error=${encodeURIComponent(error?.message ?? "Speichern fehlgeschlagen")}`);
  }

  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/stats");

  // Weiter zur ~15-Sekunden-Reflexion für den letzten (finalen) Ausstieg:
  // erst "Wie hast du dich vor dem Trade gefühlt?", danach die bestehende
  // Reflexion (Emotion danach, Regeleinhaltung, Strategie, Verbesserung).
  // Bei mehreren Teil-Exits landen die übrigen direkt im Journal.
  const lastTradeId = inserted![inserted!.length - 1].id;
  redirect(`/trades/${lastTradeId}/feeling`);
}
