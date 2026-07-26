"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCSV } from "@/lib/csv";
import { detectColumns, buildFromFinishedTrades, buildFromFills, type ImportedTrade } from "@/lib/tradeImport";

export async function importTradesCsv(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const accountId = formData.get("accountId") as string;
  const pointValue = parseFloat(formData.get("pointValue") as string) || 1;
  const file = formData.get("file") as File | null;

  if (!accountId || !file || file.size === 0) {
    redirect(`/trades/import?error=${encodeURIComponent("Bitte Konto und CSV-Datei auswählen")}`);
  }

  const text = await file!.text();
  const rows = parseCSV(text);

  if (rows.length < 2) {
    redirect(`/trades/import?error=${encodeURIComponent("Die Datei enthält keine erkennbaren Zeilen")}`);
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const { mode, columns } = detectColumns(headers);

  let imported: ImportedTrade[];
  if (mode === "finished_trades") {
    imported = buildFromFinishedTrades(dataRows, columns);
  } else if (mode === "fills") {
    imported = buildFromFills(dataRows, columns);
  } else {
    redirect(
      `/trades/import?error=${encodeURIComponent(
        "Spalten in der Datei nicht erkannt. Erwartet werden Spalten wie Symbol/Instrument, Side/B-S, Qty, Price und Time (oder Entry/Exit Price direkt)."
      )}`
    );
  }

  if (imported!.length === 0) {
    redirect(`/trades/import?error=${encodeURIComponent("Keine gültigen Trades in der Datei gefunden")}`);
  }

  const rowsToInsert = imported!.map((t) => {
    const priceDiff = t.direction === "Long" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
    const pnl = priceDiff * t.contracts * pointValue - t.fees;

    return {
      user_id: user.id,
      account_id: accountId,
      instrument: t.instrument,
      direction: t.direction,
      contracts: t.contracts,
      entry_price: t.entryPrice,
      exit_price: t.exitPrice,
      fees: t.fees,
      pnl,
      opened_at: t.openedAt,
      closed_at: t.closedAt,
      setup: "CSV-Import",
    };
  });

  const { error, count } = await supabase.from("trades").insert(rowsToInsert, { count: "exact" });

  if (error) {
    redirect(`/trades/import?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/stats");
  redirect(`/journal?imported=${count ?? rowsToInsert.length}`);
}
