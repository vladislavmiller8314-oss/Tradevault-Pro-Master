import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/supabase/queries";

const SECTIONS = [
  {
    title: "Dashboard",
    text: "Zeigt Kontostand, Tages-P&L, Winrate, Profit Factor, die Equity Curve, deine letzten Trades, eine Kontenübersicht sowie Live-Marktdaten (TradingView) und den Wirtschaftskalender (Investing.com). Welche Module sichtbar sind, stellst du unter Einstellungen ein.",
  },
  {
    title: "Neuer Trade",
    text: "Über den grünen Button oben rechts. Erfasse Konto, Instrument, Richtung, Kontrakte, Entry/Exit, optional Stop/Take-Profit, Gebühren, Punktwert (bestimmt die P&L-Berechnung), Setup, Screenshot und Notizen. Die P&L wird automatisch berechnet.",
  },
  {
    title: "Post-Trade-Reflexion",
    text: "Direkt nach dem Speichern eines Trades: Emotion per Emoji (23 zur Auswahl, oder eigenes Gefühl als Freitext eintragen), Regeleinhaltung (Eingehalten/Teilweise/Gebrochen), Strategie-Tags und ein kurzer Verbesserungssatz — alles per Tap in ca. 15 Sekunden, kann übersprungen werden.",
  },
  {
    title: "Journal",
    text: "Tabellarische Liste aller Trades mit Emotion, Regeleinhaltung und P&L. Über die 🏆/💀-Symbole markierst du einen Trade direkt für die Hall of Fame oder Hall of Shame.",
  },
  {
    title: "Replay",
    text: "Hall of Fame und Hall of Shame zeigen deine markierten Trades als Karten inkl. Screenshot. Darunter läuft eine chronologische Timeline aller Trades mit Setup, Emotion und Verbesserungsnotiz.",
  },
  {
    title: "Statistiken",
    text: "Auswertung nach Instrument, Strategie und Konto (Tabellen mit Trades/Winrate/Ø P&L/Gesamt-P&L) sowie nach Wochentag, Uhrzeit, Regeleinhaltung und Emotion vorher/nachher getrennt (Balkenlisten) — hilft, Muster in deinem Trading zu erkennen.",
  },
  {
    title: "Konten",
    text: "Lege beliebig viele Konten an (Prop, Live, Demo, Evaluation) mit Startkapital, Währung und Broker. Jeder Trade muss einem Konto zugeordnet sein. Zeigt außerdem eine Guthabenübersicht mit dem echten Live-Stand je Konto (Startkapital + P&L), nicht nur dem unveränderten Startwert.",
  },
  {
    title: "Kalender",
    text: "Profit-Kalender: zeigt pro Tag auf einen Blick, wie viel Gewinn oder Verlust du gemacht hast — grün eingefärbt für Gewinn, rot für Verlust, Intensität je nach Höhe. Monats-Summe und Anzahl Handelstage oben, mit Vor-/Zurück-Navigation zwischen Monaten.",
  },
  {
    title: "Coach",
    text: "Zeigt Stärken, Schwächen und konkrete Tipps zu deinem Trading, basierend auf deinen aggregierten Statistiken (nie einzelne Trades oder Kontostände). Die kostenlose Analyse läuft ohne API-Key oder Kosten direkt hier. Optional gibt es zusätzlich eine Claude-Analyse für nuanciertere Formulierungen — braucht einen eigenen Anthropic-API-Key (siehe README) und verursacht dann Kosten. Braucht mindestens 5 Trades.",
  },
  {
    title: "Rangliste",
    text: "Optional: vergleiche deine Winrate und deinen Profit Factor anonymisiert mit anderen Nutzern, unter einem selbst gewählten Anzeigenamen. Es werden nie einzelne Trades oder echte Beträge geteilt, und ohne Zustimmung unter Einstellungen erscheinst du gar nicht in der Liste.",
  },
  {
    title: "Einstellungen",
    text: "Dashboard-Widgets einzeln an- oder abschalten, darunter auch „Mein Regelwerk“ und „Meine Strategien“ — trag dort deine persönlichen Trading-Regeln bzw. Setups ein (eine pro Zeile), sie erscheinen dann als Checkliste auf dem Dashboard. Musik-Integration: beliebig viele Spotify-, Apple-Music-, YouTube-Music- oder SoundCloud-Links hinterlegen — erscheinen als Auswahlliste über den Musik-Button (🎵) oben rechts, ohne dass ein Konto verknüpft wird.",
  },
  {
    title: "App installieren",
    text: "Unter Einstellungen → „App installieren“ lässt sich TradeVault Pro als installierbare App einrichten: eigenes Icon, kein Browser-Rahmen, direkt vom Homescreen/Startmenü startbar — auf Windows, Mac, Android und iPhone/iPad, ganz ohne App Store.",
  },
];

export default async function HelpPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await fetchProfile(supabase, user.id);

  return (
    <AppShell userEmail={user.email} musicLinks={profile.musicLinks}>
      <div className="p-6 max-w-2xl">
        <div className="text-xs uppercase tracking-wider text-ink-muted mb-1">Handbuch</div>
        <p className="text-sm text-ink-muted mb-6">
          Kurzüberblick über jede Funktion von TradeVault Pro.
        </p>

        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <div key={s.title} className="rounded-panel bg-panel-raised border border-panel-line p-4">
              <h2 className="text-sm font-semibold text-ink mb-1.5">{s.title}</h2>
              <p className="text-sm text-ink-muted leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
