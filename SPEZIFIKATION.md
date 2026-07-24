# TradeVault Pro — Verfeinerte Spezifikation

Basierend auf dem Original-Master-Prompt, mit geschlossenen Lücken und
konkreten technischen Entscheidungen.

## 1. Design-Tokens (final)

| Token | Wert | Verwendung |
|---|---|---|
| `panel` | `#0F1117` | Basis-Hintergrund |
| `panel-raised` | `#161923` | Karten/Widget-Flächen |
| `panel-inset` | `#0A0B10` | Vertiefte Flächen (Eingaben, Gauges) |
| `gain` | `#00C853` | Gewinne, positive Werte |
| `loss` | `#D32F2F` | Verluste, negative Werte |
| `accent-amber` | `#FFB020` | Prop/Evaluation-Markierungen, Warnungen |
| `ink` | `#E8EAF0` | Primärtext |

**Schrift:** Inter (UI-Text), JetBrains Mono (alle Zahlen — Kontostand,
P&L, Preise). Die Kombination Sans + Mono für Zahlen ist bewusst gewählt:
Terminal-typisch (Bloomberg) und macht Zahlen sofort als Daten erkennbar.

**Signature-Element:** Die Winrate/Profit-Factor-Anzeigen sind als
Halbkreis-Instrumente gestaltet (Porsche-Dashboard-Tacho-Optik) statt
als generische Fortschrittsbalken — Farbwechsel Grün/Rot am
Redline-Punkt, ohne dass eine Zahl gelesen werden muss.

## 2. Geklärte Lücken aus dem Original-Prompt

- **Multi-Account-Aggregation:** Dashboard-KPIs beziehen sich standardmäßig
  auf das zuletzt aktive Konto; ein Konto-Switcher in der TopBar erlaubt
  Wechsel. Eine "Alle Konten"-Ansicht aggregiert P&L/Equity kontoübergreifend.
- **P&L-Berechnung:** `pnl = (exit - entry) * contracts * tick_value - fees`
  (long) bzw. umgekehrtes Vorzeichen (short). Der `tick_value` wird pro
  Instrument in einer Referenztabelle hinterlegt (nicht im Original spezifiziert).
- **Datenquelle Marktmonitor/Wirtschaftskalender:** entschieden —
  Marktmonitor läuft über das kostenlose **TradingView Market-Overview-
  Widget** (`components/TradingViewMarketOverview.tsx`, Futures-Symbole:
  ES, NQ, YM, CL, GC, 6E), der Wirtschaftskalender über das kostenlose
  **Investing.com Economic-Calendar-Widget** (`components/InvestingEconomicCalendar.tsx`,
  eingebettet per iframe). Beide brauchen keinen API-Key, laufen aber als
  Embeds Dritter — kein eigenes Datenmodell, keine Kontrolle über Ausfälle
  der jeweiligen Anbieter. Der `lang`-Parameter beim Investing.com-Embed
  steht aktuell auf Englisch (`lang=1`); für deutsche Beschriftungen einen
  eigenen Code über de.investing.com/webmaster-tools generieren und in
  `InvestingEconomicCalendar.tsx` eintragen.
  Musik-Integrationen (Spotify/Apple Music/YouTube Music/SoundCloud)
  laufen jeweils über OAuth des Anbieters — hoher Aufwand für ein
  "Optional"-Feature; Vorschlag: erst nach MVP.
- **Screenshot-Speicherung:** Supabase Storage Bucket `trade-screenshots`,
  RLS-geschützt pro `user_id`.
- **Replay/Hall of Fame:** `trade_highlights`-Tabelle im Schema verknüpft
  Trades mit Kategorie (`hall_of_fame` / `hall_of_shame`) + Kommentar.
- **Post-Trade-Reflexion:** Nach dem Speichern eines Trades landet man auf
  `/trades/[id]/reflect` — Emotion (Emoji-Tap), Regeleinhaltung (3 Buttons),
  Strategie (Chips) und eine Einzeiler-Verbesserungsnotiz, alles per Tap/
  kurzer Eingabe in ~15 Sekunden erledigt, überspringbar. Neue Spalten
  `rule_adherence` und `improvement_note` in `trades` — bei bestehenden
  Datenbanken über `supabase/migration_reflection.sql` nachziehen.

## 3. Architektur

```
tradevault-pro/
├── app/                  Next.js App Router (Server Components default)
│   ├── page.tsx          Dashboard
│   ├── journal/          Trade Journal
│   ├── accounts/         Kontenverwaltung (nächster Schritt)
│   ├── replay/           Replay + Hall of Fame/Shame (nächster Schritt)
│   └── stats/            Statistik-Ansichten (nächster Schritt)
├── components/           Wiederverwendbare Widgets
├── lib/supabase/         Client + Server-seitige Supabase-Helper
├── types/                Geteilte TypeScript-Typen
└── supabase/schema.sql   Postgres-Schema inkl. RLS-Policies
```

**Datenfluss:** Server Components laden initiale Daten direkt aus
Supabase (kein Client-Loading-Spinner beim ersten Render). Mutationen
(neuer Trade, Konto anlegen) laufen über Server Actions.

**Widgets:** `profiles.active_widgets` (text-Array in Supabase) steuert,
welche Dashboard-Module ein Trader sieht — Grundlage für die geforderte
"frei aktivierbar/deaktivierbar"-Anforderung.

## 4. Neue Design-Referenz (Sidebar-Layout)

Du hast ein konkretes Referenz-Mockup vorgegeben: Sidebar-Navigation
(Dashboard, Trades, Replay, Kalender, Statistiken, Konten, Gebühren,
Ziele, Analyse, KI Coach, Einstellungen) mit Kontenliste darunter,
Header mit Begrüßung/Datum/Suche/Benachrichtigungen/Avatar, 6 KPI-Karten
(inkl. Ø R-Multiple, Max Drawdown), Kontenübersicht als Tabelle mit
Drawdown-Balken, Letzte Trades mit R-Multiple-Badges, „Markt heute"- und
„KI Coach"-Panel, Trade-Replay-Vorschau.

Das eigenständige HTML-Preview (`tradevault-pro.html`) ist bereits auf
dieses Layout umgestellt und mit deinem Logo bestückt — offline testbar.
Im Next.js-Projekt ist bisher nur das Logo übernommen; die
Sidebar-Struktur und die neuen Widgets (KI Coach, erweiterte
Kontentabelle, Replay-Vorschau) sind der nächste sinnvolle Schritt,
sobald das Trade-Erfassungsformular steht — dann bauen wir das
Dashboard einmal auf Basis echter Daten neu zusammen, statt es zweimal
zu machen.

## 5. Desktop- & Mobile-App

TradeVault Pro ist jetzt eine installierbare **PWA (Progressive Web App)**:

- `public/manifest.json` + Icons (192/512/maskable/Apple Touch Icon aus
  deinem Logo generiert)
- `public/sw.js` — minimaler Service Worker, macht die App installierbar
  und fängt kurze Netzwerkaussetzer ab (Network-first, kein echtes
  Offline-Trading — ergibt bei Live-Marktdaten ohnehin wenig Sinn)
- „App installieren"-Button unter `/settings` (nutzt den nativen
  `beforeinstallprompt`-Dialog auf Chrome/Edge/Android; auf iOS/Safari
  gibt's stattdessen eine Anleitung für „Zum Home-Bildschirm")

**Was das bedeutet:** Auf Windows/Mac/Android bekommst du ein eigenes
App-Icon im Startmenü/Homescreen, die App startet ohne Adressleiste in
einem eigenen Fenster. Auf iPhone/iPad genauso über „Zum Home-Bildschirm".
Kein App-Store-Download nötig — aber auch kein Eintrag im App Store/
Microsoft Store, falls das für dich wichtig ist.

**Was das NICHT ist — bewusst nicht umgesetzt:**

- **Electron/Tauri** (echte Desktop-App mit .exe/.dmg-Installer): Würde
  eine komplette zweite Build-Pipeline brauchen (Rust- oder
  Electron-Toolchain, Code-Signing-Zertifikate für Windows/Mac, damit
  Nutzer keine Sicherheitswarnung sehen). Technisch machbar, aber nicht
  etwas, das sich hier im Chat bauen und testen lässt — das braucht
  einen lokalen Build auf deinem Rechner.
- **Native iOS/Android-App** (echter App-Store-Eintrag, z. B. über
  Capacitor als Wrapper um dieselbe Next.js-App): Gleiche Einschränkung —
  Xcode bzw. Android Studio, Entwickler-Accounts bei Apple (99 $/Jahr)
  und Google (25 $ einmalig), Code-Signing. Capacitor könnte dieselbe
  Codebasis wiederverwenden, das wäre der nächste sinnvolle Schritt,
  falls ein echter Store-Eintrag gewünscht ist.

Für den täglichen Gebrauch ("App-Gefühl" auf allen Geräten, ohne
Store-Umweg) deckt die PWA das Ziel aus deiner Anfrage ab.

## 6. Nächste Schritte (Priorität)

1. ~~Supabase-Projekt anlegen, `supabase/schema.sql` ausführen~~
2. ~~Auth (E-Mail/Passwort) über Supabase Auth verdrahten~~ — erledigt
3. ~~Server Actions für Trade-Erstellung (inkl. Screenshot-Upload)~~ —
   erledigt: `/trades/new` mit vollständigem Formular, `/accounts` zum
   Anlegen von Konten (Voraussetzung für Trades), P&L wird serverseitig
   aus Entry/Exit/Kontrakte/Punktwert/Gebühren berechnet
4. ~~Mock-Daten in Dashboard/Journal durch echte Supabase-Queries ersetzen~~
   — erledigt: `lib/supabase/queries.ts` liefert Konten (mit berechnetem
   Kontostand = Startkapital + Summe P&L), Trades und eine aus dem
   Trade-Verlauf abgeleitete Equity Curve. Dashboard und Journal zeigen
   jetzt echte Daten inkl. Empty States, wenn noch kein Konto/Trade existiert
5. ~~Statistik-Seite: Gruppierung nach Instrument/Setup/Konto/Uhrzeit/Wochentag~~
   — erledigt: `/stats` mit Tabellen (Instrument, Setup, Konto) und
   Balken-Listen (Wochentag, Uhrzeit, Regeleinhaltung, Emotion) —
   Letztere nutzen direkt die neuen Reflexions-Daten
6. ~~Replay-Ansicht mit Timeline-Komponente~~ — erledigt: `/replay` mit
   Hall of Fame, Hall of Shame und einer chronologischen Timeline aller
   Trades (inkl. Screenshot, Setup, Verbesserungsnotiz). Im Journal gibt
   es pro Trade jetzt 🏆/💀-Buttons, um ihn direkt zu markieren.
7. ~~Sidebar-Layout im echten Next.js-Projekt umsetzen~~ — erledigt:
   `components/Sidebar.tsx` + `components/AppShell.tsx` ersetzen die
   alte TopBar auf allen Seiten. Sidebar mit aktiver Routen-Markierung,
   Logo, Abmelden; Kopfzeile mit Musik-Button und „Neuer Trade".
8. ~~Frei aktivierbare/deaktivierbare Widgets~~ — erledigt: `/settings`
   schreibt in `profiles.active_widgets`, das Dashboard rendert jedes
   Modul nur, wenn es aktiviert ist (`lib/widgets.ts` als Katalog).
9. ~~Musik-Integration~~ — erledigt, als leichtgewichtige Variante ohne
   OAuth: Nutzer fügt einen öffentlichen Spotify-/Apple-Music-/
   YouTube-Music-/SoundCloud-Link ein (`/settings`), der als eingebetteter
   Player über den Musik-Button (🎵) in der Kopfzeile erscheint
   (`lib/music.ts`, `components/MusicButton.tsx`). Kein Konto-Login bei
   den Anbietern nötig — echte OAuth-Integration mit eigener Bibliothek/
   Wiedergabesteuerung bleibt bewusst draußen (siehe Abschnitt 2).
10. ~~Handbuch~~ — erledigt: `/help`, erreichbar über den „Handbuch"-Link
    unten in der Sidebar auf jeder Seite, mit einem kurzen Abschnitt pro
    Funktion.

Damit ist auch die erweiterte Roadmap durch. Echte offene Punkte für die
nächste Runde:

- ~~Deployment auf Vercel~~ — Anleitung steht jetzt in der README
  ("Deployment auf Vercel"), inkl. Umgebungsvariablen und Supabase-
  Redirect-URLs. Das eigentliche Deployment selbst muss im eigenen
  Vercel-Account ausgeführt werden — das kann ich nicht für dich erledigen.
- ~~"Alle Konten"-Aggregatsansicht~~ — erledigt: Dashboard zeigt bei mehr
  als einem Konto Filter-Pills ("Alle Konten" + je Konto), per
  `?account=`-Query-Parameter. Equity Curve, KPIs und letzte Trades
  filtern entsprechend mit.
- ~~Mobile Bottom-Nav~~ — erledigt: `components/MobileBottomNav.tsx`,
  aktiv unter 768px (Tailwind `md`-Breakpoint). Zeigt Dashboard/Journal/
  Replay/Statistiken direkt, der Rest (Konten, Einstellungen, Handbuch,
  Abmelden) über ein "Mehr"-Sheet von unten — analog zum HTML-Preview.

Was jetzt wirklich noch fehlt, ist eher Politur als neue Funktionalität:

- ~~Ladezustände/Skeletons~~ — erledigt: jede Seite mit Datenladevorgang
  hat ein `loading.tsx` (Next.js zeigt das automatisch, während die
  Server Component lädt), `components/ShellSkeleton.tsx` verhindert
  dabei den Sidebar-Flackerneffekt.
- ~~Fehlerseiten~~ — erledigt: `app/not-found.tsx` (404, z. B. bei einem
  gelöschten Trade in der Reflexion), `app/error.tsx` (Laufzeitfehler
  innerhalb einer Seite, mit "Erneut versuchen"), `app/global-error.tsx`
  (Fallback, falls sogar das Root-Layout selbst crasht).
- **Test mit echten Zugangsdaten** — das kann ich nicht für dich
  übernehmen, da ich keinen Zugriff auf Supabase/Vercel habe. Sobald du
  einmal durch Registrierung → Konto anlegen → Trade erfassen →
  Reflexion → Dashboard gegangen bist, sag mir, wo es hakt — dann fixe
  ich das gezielt.
