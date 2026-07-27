"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchTrades } from "@/lib/supabase/queries";
import { buildStatsSummary, callClaudeForCoachInsights, generateHeuristicInsights } from "@/lib/coach";

const MIN_TRADES = 5;

async function getUserAndTrades() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const trades = await fetchTrades(supabase, user.id);

  if (trades.length < MIN_TRADES) {
    redirect(
      `/coach?error=${encodeURIComponent(
        `Mindestens ${MIN_TRADES} Trades nötig für eine sinnvolle Analyse (aktuell ${trades.length}).`
      )}`
    );
  }

  return { supabase, user, trades };
}

// Kostenlos, ohne API-Key — läuft komplett lokal auf dem Server.
export async function generateFreeCoachInsights() {
  const { supabase, user, trades } = await getUserAndTrades();

  const insights = generateHeuristicInsights(trades);

  const { error } = await supabase.from("coach_insights").insert({
    user_id: user.id,
    content: insights,
    trade_count: trades.length,
    source: "free",
  });

  if (error) {
    redirect(`/coach?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/coach");
  redirect("/coach?generated=1");
}

// Braucht einen eigenen ANTHROPIC_API_KEY und verursacht Kosten auf dem
// eigenen Anthropic-Konto — siehe SPEZIFIKATION.md, Abschnitt 11.
export async function generateAiCoachInsights() {
  const { supabase, user, trades } = await getUserAndTrades();

  let errorMessage: string | null = null;

  try {
    const summary = buildStatsSummary(trades);
    const insights = await callClaudeForCoachInsights(summary);

    const { error } = await supabase.from("coach_insights").insert({
      user_id: user.id,
      content: insights,
      trade_count: trades.length,
      source: "ai",
    });

    if (error) {
      errorMessage = error.message;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unbekannter Fehler";
  }

  if (errorMessage) {
    redirect(`/coach?error=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath("/coach");
  redirect("/coach?generated=1");
}
