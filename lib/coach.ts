import type { Trade } from "@/types/trade";
import { groupBy, groupByMulti, toStatsRows, weekdayLabel, hourBucketLabel, ruleLabel } from "@/lib/stats";

// Baut eine kompakte Text-Zusammenfassung aus aggregierten Kennzahlen —
// keine einzelnen Trades, keine Kontostände, keine Screenshots. Nur
// Muster (Winrate/P&L je Kategorie), die für eine sinnvolle Analyse
// nötig sind. Das hält den Prompt klein und die Daten so anonym wie
// für eine nützliche Analyse möglich.
export function buildStatsSummary(trades: Trade[]): string {
  const wins = trades.filter((t) => t.pnl > 0).length;
  const winrate = Math.round((wins / trades.length) * 100);
  const grossWin = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;

  const byInstrument = toStatsRows(groupBy(trades, (t) => t.instrument)).slice(0, 6);
  const byStrategy = toStatsRows(
    groupByMulti(trades, (t) => (t.strategyTags.length > 0 ? t.strategyTags : [t.setup || "Ohne Strategie"]))
  ).slice(0, 6);
  const byWeekday = toStatsRows(groupBy(trades, (t) => weekdayLabel(new Date(t.closedAt))));
  const byHour = toStatsRows(groupBy(trades, (t) => hourBucketLabel(new Date(t.closedAt))));
  const byRule = toStatsRows(groupBy(trades, (t) => ruleLabel(t.ruleAdherence)));
  const byEmotionAfter = toStatsRows(groupBy(trades, (t) => t.emotion || "Nicht angegeben"));
  const byEmotionBefore = toStatsRows(
    groupBy(
      trades.filter((t) => t.preTradeEmotion),
      (t) => t.preTradeEmotion!
    )
  );
  const byDirection = toStatsRows(groupBy(trades, (t) => t.direction));

  const fmtRows = (rows: ReturnType<typeof toStatsRows>) =>
    rows
      .map((r) => `${r.name}: ${r.count} Trades, ${r.winrate}% Winrate, Ø ${r.avgPnl.toFixed(0)} P&L`)
      .join("; ");

  return `
Gesamt: ${trades.length} Trades, Winrate ${winrate}%, Profit Factor ${profitFactor.toFixed(2)}.
Nach Instrument: ${fmtRows(byInstrument) || "keine Daten"}.
Nach Strategie: ${fmtRows(byStrategy) || "keine Daten"}.
Nach Richtung: ${fmtRows(byDirection) || "keine Daten"}.
Nach Wochentag: ${fmtRows(byWeekday) || "keine Daten"}.
Nach Uhrzeit: ${fmtRows(byHour) || "keine Daten"}.
Nach Regeleinhaltung: ${fmtRows(byRule) || "keine Daten"}.
Nach Emotion vor dem Trade: ${fmtRows(byEmotionBefore) || "keine Daten"}.
Nach Emotion nach dem Trade: ${fmtRows(byEmotionAfter) || "keine Daten"}.
`.trim();
}

export interface CoachInsight {
  type: "staerke" | "schwaeche" | "tipp";
  text: string;
}

// ---------------------------------------------------------------------
// Kostenlose Variante: regelbasierte Muster-Erkennung, komplett ohne
// externe API. Läuft direkt auf dem Server, kostet nichts, braucht
// keinen API-Key. Nicht so nuanciert wie eine echte KI-Analyse, aber
// findet dieselben Muster, die auch die Statistik-Seite zeigt — nur
// automatisch zusammengefasst und mit Handlungsempfehlung.
const MIN_GROUP_TRADES = 3;
const NOTABLE_WINRATE_GAP = 15; // Prozentpunkte Abweichung vom Durchschnitt

function overallWinrate(trades: Trade[]): number {
  const wins = trades.filter((t) => t.pnl > 0).length;
  return trades.length ? Math.round((wins / trades.length) * 100) : 0;
}

function bestAndWorst(rows: ReturnType<typeof toStatsRows>) {
  const eligible = rows.filter((r) => r.count >= MIN_GROUP_TRADES);
  if (eligible.length < 2) return null;
  const sorted = [...eligible].sort((a, b) => b.avgPnl - a.avgPnl);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

export function generateHeuristicInsights(trades: Trade[]): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const baseline = overallWinrate(trades);

  const grossWin = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;

  insights.push({
    type: profitFactor >= 1.5 ? "staerke" : profitFactor >= 1 ? "tipp" : "schwaeche",
    text:
      profitFactor >= 1.5
        ? `Dein Profit Factor liegt bei ${profitFactor.toFixed(2)} — deine Gewinne übersteigen deine Verluste deutlich. Weiter so.`
        : profitFactor >= 1
        ? `Dein Profit Factor liegt bei ${profitFactor.toFixed(2)} — du bist insgesamt profitabel, aber der Puffer ist noch dünn. Ein paar Verlust-Trades weniger würden viel bringen.`
        : `Dein Profit Factor liegt bei ${profitFactor.toFixed(2)} — deine Verluste übersteigen aktuell deine Gewinne. Bevor du das Volumen erhöhst, lohnt sich ein Blick darauf, welche Trades die größten Verluste verursachen.`,
  });

  // Regeleinhaltung — meist das aussagekräftigste Signal
  const byRule = toStatsRows(groupBy(trades, (t) => ruleLabel(t.ruleAdherence)));
  const eingehalten = byRule.find((r) => r.name === "✅ Eingehalten");
  const gebrochen = byRule.find((r) => r.name === "❌ Gebrochen");
  if (eingehalten && gebrochen && eingehalten.count >= MIN_GROUP_TRADES && gebrochen.count >= MIN_GROUP_TRADES) {
    const gap = eingehalten.winrate - gebrochen.winrate;
    if (gap >= NOTABLE_WINRATE_GAP) {
      insights.push({
        type: "schwaeche",
        text: `Wenn du deine Regeln eingehalten hast, lag deine Winrate bei ${eingehalten.winrate}% — bei Regelbrüchen nur bei ${gebrochen.winrate}%. Das ist ein klares Signal: Disziplin schlägt bei dir messbar zu Buche.`,
      });
    }
  }

  // Bester/schlechtester Wochentag
  const byWeekday = bestAndWorst(toStatsRows(groupBy(trades, (t) => weekdayLabel(new Date(t.closedAt)))));
  if (byWeekday) {
    insights.push({
      type: "staerke",
      text: `${byWeekday.best.name} ist bisher dein stärkster Handelstag: ${byWeekday.best.winrate}% Winrate, Ø ${byWeekday.best.avgPnl.toFixed(0)} P&L über ${byWeekday.best.count} Trades.`,
    });
    if (byWeekday.worst.avgPnl < 0) {
      insights.push({
        type: "tipp",
        text: `An ${byWeekday.worst.name}en läuft es im Schnitt negativ (Ø ${byWeekday.worst.avgPnl.toFixed(0)} P&L über ${byWeekday.worst.count} Trades). Prüfe, ob dort andere Rahmenbedingungen vorliegen — oder reduziere an diesem Tag bewusst die Größe.`,
      });
    }
  }

  // Bester/schlechtester Zeitblock
  const byHour = bestAndWorst(toStatsRows(groupBy(trades, (t) => hourBucketLabel(new Date(t.closedAt)))));
  if (byHour && byHour.best.name !== byHour.worst.name) {
    insights.push({
      type: "tipp",
      text: `Zwischen ${byHour.best.name} läuft es am besten (${byHour.best.winrate}% Winrate). Zwischen ${byHour.worst.name} dagegen deutlich schwächer (${byHour.worst.winrate}%) — ein Blick, ob sich der Handel auf das stärkere Zeitfenster konzentrieren lässt, könnte sich lohnen.`,
    });
  }

  // Beste Strategie
  const byStrategyHeuristic = bestAndWorst(
    toStatsRows(groupByMulti(trades, (t) => (t.strategyTags.length > 0 ? t.strategyTags : [t.setup || "Ohne Strategie"])))
  );
  if (byStrategyHeuristic) {
    insights.push({
      type: "staerke",
      text: `„${byStrategyHeuristic.best.name}" ist deine bisher stärkste Strategie: ${byStrategyHeuristic.best.winrate}% Winrate über ${byStrategyHeuristic.best.count} Trades.`,
    });
  }

  // Emotion vor dem Trade
  const byEmotionBefore = bestAndWorst(
    toStatsRows(groupBy(trades.filter((t) => t.preTradeEmotion), (t) => t.preTradeEmotion!))
  );
  if (byEmotionBefore && byEmotionBefore.worst.avgPnl < 0) {
    insights.push({
      type: "schwaeche",
      text: `Trades, bei denen du dich vorher „${byEmotionBefore.worst.name}" gefühlt hast, laufen im Schnitt negativ (Ø ${byEmotionBefore.worst.avgPnl.toFixed(0)} P&L). Das könnte ein guter Moment sein, vor dem Trade kurz innezuhalten.`,
    });
  }

  // Long vs. Short
  const byDirection = toStatsRows(groupBy(trades, (t) => t.direction));
  const long = byDirection.find((r) => r.name === "Long");
  const short = byDirection.find((r) => r.name === "Short");
  if (long && short && long.count >= MIN_GROUP_TRADES && short.count >= MIN_GROUP_TRADES) {
    const gap = Math.abs(long.winrate - short.winrate);
    if (gap >= NOTABLE_WINRATE_GAP) {
      const better = long.winrate > short.winrate ? long : short;
      const worse = long.winrate > short.winrate ? short : long;
      insights.push({
        type: "tipp",
        text: `${better.name}-Trades laufen für dich deutlich besser als ${worse.name}-Trades (${better.winrate}% vs. ${worse.winrate}% Winrate). Wert, beim nächsten ${worse.name}-Setup besonders genau zu prüfen, ob es wirklich passt.`,
      });
    }
  }

  if (insights.length < 3) {
    insights.push({
      type: "tipp",
      text: `Mit ${trades.length} Trades und Winrate ${baseline}% lassen sich noch nicht viele belastbare Muster erkennen — je mehr Trades dazukommen, desto aussagekräftiger wird diese Analyse.`,
    });
  }

  return insights.slice(0, 6);
}


const SYSTEM_PROMPT = `Du bist ein erfahrener, direkter Trading-Coach für Futures-Trader. Du bekommst ausschließlich aggregierte Statistiken eines Traders (keine einzelnen Trades, keine Kontostände). Gib konkrete, konstruktive Hinweise auf Deutsch: was gut läuft, welche Muster auf Probleme hindeuten, und was der Trader konkret ausprobieren könnte.

Antworte AUSSCHLIESSLICH mit validem JSON in genau diesem Format, ohne Markdown-Codeblock, ohne einleitenden Text:
{"insights": [{"type": "staerke", "text": "..."}, {"type": "schwaeche", "text": "..."}, {"type": "tipp", "text": "..."}]}

Regeln:
- 4 bis 6 Einträge insgesamt, Mischung aus allen drei Typen
- Jeder Text 1-2 Sätze, konkret mit Zahlen aus den Daten belegt, keine Plattitüden
- Bei zu wenig oder zu gleichmäßigen Daten: das ehrlich benennen statt Muster zu erfinden
- Keine Finanzberatung, keine Kauf-/Verkaufsempfehlungen — nur Verhaltens- und Prozess-Feedback`;

export async function callClaudeForCoachInsights(statsSummary: string): Promise<CoachInsight[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY ist nicht gesetzt. Trag deinen eigenen Anthropic-API-Key in den Vercel-Umgebungsvariablen ein."
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: statsSummary }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Claude API Fehler (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const rawText: string = data.content?.[0]?.text ?? "";

  const cleaned = rawText.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.insights)) throw new Error("Unerwartetes Format");
    return parsed.insights;
  } catch {
    throw new Error("Antwort der KI konnte nicht gelesen werden. Bitte erneut versuchen.");
  }
}
