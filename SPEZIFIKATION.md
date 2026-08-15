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

## 6. Broker-Anbindung / CSV-Import

Ursprünglicher Wunsch: Broker direkt verbinden, damit Trades automatisch
erfasst werden und nur noch die 15-Sekunden-Reflexion übrig bleibt.

**Recherche-Ergebnis:** Es gibt keine "eine API für alle Broker" — jede
Plattform ist anders, und der Zugang liegt jeweils beim Broker, nicht bei
uns. Tradovate z. B. gibt Einzeltradern einen selbst erzeugbaren API-Key
(Live-Konto, >1.000 $ Guthaben). The Trading Pit / Volume Trader Terminal
läuft dagegen über **Rithmic** — dafür braucht es eine Zulassung als
"Rithmic Certified Developer" bei Rithmic selbst, kein Software-Problem,
sondern ein externer Freigabeprozess.

**Manuelle Erfassung, jetzt auch mit Teilgewinnmitnahme:** Das
Trade-Formular (`/trades/new`) hat jetzt einen Entry-Bereich (Konto,
Instrument, Richtung, Entry-Preis, Einstiegszeit) und einen separaten
Ausstiegs-Bereich (`components/ExitLegsInput.tsx`), in dem sich beliebig
viele Ausstiege hinzufügen lassen — je mit eigener Kontraktzahl, Exit-Preis
und Ausstiegszeit. Beim Speichern legt `createTrade` automatisch einen
Trade-Datensatz **pro Ausstieg** an (gleicher Entry, unterschiedlicher
Exit), Gebühren werden proportional zur Kontraktzahl aufgeteilt — nach
demselben Prinzip wie beim CSV-Import (siehe unten). Bei nur einem
Ausstieg (Standardfall) ändert sich für den Nutzer nichts.

**CSV-Import** (`/trades/import`, verlinkt von Journal und Trade-Formular
aus):

- `lib/csv.ts` — eigener CSV-Parser (Komma/Semikolon-Erkennung,
  Anführungszeichen, Escapes), keine externe Abhängigkeit
- `lib/tradeImport.ts` — erkennt Spalten automatisch über Alias-Listen
  (z. B. "Symbol"/"Instrument"/"Product"), unterstützt zwei Modi:
  - **Fertige Trades:** eine Zeile pro Trade mit Entry+Exit-Preis
  - **Einzelne Fills:** eine Zeile pro Kauf/Verkauf — wird per FIFO-Matching
    zu Round-Turn-Trades zusammengeführt, inkl. korrekter Gebühren-Aufteilung
    bei Teilausführungen und Positions-Reversals (mit Testfällen geprüft,
    siehe unten)
- Importierte Trades bekommen das Setup „CSV-Import" und landen direkt im
  Journal (keine einzelne Reflexion pro Trade bei Bulk-Import — das wäre
  bei z. B. 50 Trades auf einmal nicht mehr "15 Sekunden"). Emotion/
  Regeleinhaltung lassen sich über „Bearbeiten" nachtragen.

**Getestet (lokal, mit Beispieldaten):** CSV-Parsing inkl. Sonderzeichen,
Spalten-Erkennung, FIFO-Matching inkl. Reversal-Szenario — Gebühren-Summe
vor/nach Verteilung stimmte exakt überein. **Nicht getestet:** ein echter
Export aus Volume Trader Terminal, da mir kein Beispiel vorliegt — die
Spalten-Alias-Liste in `lib/tradeImport.ts` lässt sich bei Bedarf leicht
um die tatsächlichen VTT-Spaltennamen ergänzen, sobald ein echter Export
vorliegt.

## 7. Trades bearbeiten/löschen, Konten löschen/archivieren

- **Trade bearbeiten:** `/trades/[id]/edit` — vorbelegtes Formular,
  identisch zum Erfassen-Formular. Achtung: der Punktwert wird nicht in
  der Datenbank gespeichert (nur zur P&L-Berechnung genutzt), beim
  Bearbeiten steht er deshalb wieder auf 1 und sollte bei Bedarf erneut
  eingetragen werden, sonst wird die P&L mit Punktwert 1 neu berechnet.
- **Trade löschen:** Button im Journal, mit Bestätigungsdialog
  (`components/ConfirmButton.tsx`).
- **Konto archivieren:** verschiebt es in den Bereich „Inaktive Konten"
  auf `/accounts` (setzt `is_archived = true`). Taucht danach nicht mehr
  im Dashboard, im Konto-Filter oder im Trade-Formular auf, bleibt aber
  mitsamt aller Trades erhalten. Kann jederzeit reaktiviert werden.
- **Konto löschen:** endgültig, mit Warnung im Bestätigungsdialog — löscht
  wegen `on delete cascade` im Schema auch alle Trades auf diesem Konto.
- **Guthabenübersicht je Konto:** `/accounts` zeigt jetzt für jedes Konto
  das echte Live-Guthaben (Startkapital + Summe aller P&L, nicht mehr das
  unveränderte Startkapital) sowie den Gesamt-P&L seit Start, plus eine
  Summenkarte oben für alle aktiven Konten zusammen. Das
  Dashboard-Widget "Kontenübersicht" zeigt zusätzlich den Tages-P&L je
  Konto. `fetchAccountsWithBalances` in `lib/supabase/queries.ts` liefert
  jetzt auch Broker, Startkapital, Gesamt-P&L und einen
  `includeArchived`-Schalter für diese Zwecke.

## 8. Emotion vor dem Trade

Direkt nach dem Speichern eines Trades kommt jetzt zuerst
`/trades/[id]/feeling` — „Wie hast du dich vor dem Trade gefühlt?" mit
eigener Emoji-Reihe (Ruhig/Zuversichtlich/Nervös/Müde/Gestresst/
Ungeduldig/Neutral), überspringbar. Danach geht's wie bisher weiter zur
bestehenden Reflexion (`/trades/[id]/reflect`: Emotion danach,
Regeleinhaltung, Strategie, Verbesserungsnotiz). Neue Spalte
`pre_trade_emotion` in `trades` — bei bestehenden Datenbanken über
`supabase/migration_pre_emotion.sql` nachziehen. Wird im Journal
("Emotion vorher → nachher") und in der Replay-Timeline angezeigt, und
lässt sich über „Bearbeiten" auch nachträglich ändern.

## 9. Rangliste (opt-in, anonymisiert)

`/leaderboard`, verlinkt in der Sidebar. Zeigt Winrate und Profit Factor
aller Nutzer, die dem zugestimmt haben — nie einzelne Trades, nie echte
Euro-/Dollar-Beträge, nur unter einem selbst gewählten Anzeigenamen.
Opt-in + Anzeigename werden unter `/settings` verwaltet. Technisch läuft
das über eine `SECURITY DEFINER`-Funktion `get_leaderboard()` in
Postgres, die kontoübergreifend aggregieren darf, ohne die strikten
RLS-Policies auf `trades`/`profiles` selbst aufzuweichen — nach außen
kommen ausschließlich die aggregierten Kennzahlen an. Mindestens 3
Trades nötig, um in der Liste zu erscheinen (sonst wenig aussagekräftig).
Neue Spalten `leaderboard_opt_in`/`leaderboard_display_name` in
`profiles` sowie die Funktion selbst — bei bestehenden Datenbanken über
`supabase/migration_leaderboard.sql` nachziehen (auch enthalten in der
gesammelten `migration_all.sql`).

## 10. Mehrfachauswahl & Sammel-Löschen im Journal

`components/JournalTable.tsx` (Client Component) ersetzt die bisherige
reine Server-Tabelle: Checkbox je Zeile, Checkbox „Alle auswählen" im
Tabellenkopf (inkl. Indeterminate-Zustand bei Teilauswahl), und eine
Aktionsleiste, die erscheint, sobald mindestens ein Trade ausgewählt ist
— mit Bestätigungsdialog vor dem endgültigen Löschen. Neue Server Action
`bulkDeleteTrades` in `app/trades/[id]/edit/actions.ts` löscht alle
ausgewählten IDs in einem Rutsch. Einzel-Bearbeiten/-Löschen pro Zeile
bleibt wie gehabt zusätzlich bestehen.

## 11. Coach (kostenlos + optional KI-gestützt)

`/coach` — zeigt Stärken/Schwächen/Tipps als Karten, basierend auf
deinen aggregierten Statistiken. Zwei Varianten, beide auf derselben
Seite:

**1. Kostenlose Analyse (Standard, immer verfügbar)**
Regelbasierte Muster-Erkennung in `lib/coach.ts:generateHeuristicInsights`
— läuft komplett auf dem eigenen Server, kein API-Key, keine Kosten,
kein Drittanbieter. Vergleicht Profit Factor, besten/schlechtesten
Wochentag, bestes/schlechtestes Zeitfenster, Wirkung von
Regeleinhaltung, Wirkung der Emotion vor dem Trade, und Long- vs.
Short-Performance — mit Mindestgrößen je Gruppe (3 Trades), damit keine
Zufallsmuster als Erkenntnis verkauft werden. Mit synthetischen
Testdaten durchgetestet: erkennt eingebaute Muster zuverlässig und
konkret (z. B. „Long-Trades laufen deutlich besser als Short-Trades,
50% vs. 33% Winrate").

**2. Claude-Analyse (optional, zusätzlicher Button)**
Echter Aufruf der Anthropic API für nuanciertere, freier formulierte
Hinweise. **Wichtig, unbedingt lesen, bevor du das einrichtest:**

- Du brauchst einen **eigenen Anthropic-API-Key** von
  [console.anthropic.com](https://console.anthropic.com) — trag ihn als
  `ANTHROPIC_API_KEY` in Vercel unter Environment Variables ein (**ohne**
  `NEXT_PUBLIC_`-Präfix, damit er niemals im Browser landet)
- Jeder Klick ist ein echter API-Aufruf und **kostet Geld auf deinem
  Anthropic-Konto** — bei den hier verwendeten Textmengen im Bereich von
  Cent-Bruchteilen pro Analyse, aber nicht kostenlos
- Alternative, falls das Anthropic-Konto vermieden werden soll: Google
  Gemini bietet über Google AI Studio einen dauerhaft kostenlosen
  API-Tier ohne Kreditkarte (Stand: Recherche Juli 2026, Kontingente
  ändern sich erfahrungsgemäß). Dafür müsste `lib/coach.ts:callClaudeForCoachInsights`
  auf den Gemini-Endpunkt umgebaut werden — bisher nicht umgesetzt, da
  die kostenlose regelbasierte Variante für die meisten Fälle ausreicht
- Modell: `claude-sonnet-5`

Beide Varianten teilen sich dieselbe Anzeige und Speicherung — neue
Spalte `source` (`free`/`ai`) in `coach_insights` zeigt an, welche
Variante gerade angezeigt wird. Mindestens 5 Trades nötig für beide
Varianten. Neue Tabelle `coach_insights` — bei bestehenden Datenbanken
über `supabase/migration_coach.sql` nachziehen.

## 12. Vier Nachbesserungen

1. **"Trades heute"-Zähler-Bug behoben:** Das Dashboard hat bisher nur
   die letzten 5 Trades geladen und daraus *auch* "Trades heute",
   Winrate und Profit Factor berechnet — bei mehr als 5 Trades insgesamt
   waren diese Werte falsch, sobald ältere Trades aus den "letzten 5"
   rausfielen. Jetzt werden alle Trades geladen; nur die "Letzte
   Trades"-Anzeige zeigt weiterhin nur 5 davon (`app/page.tsx`).
2. **Emotion vorher/nachher + Regeleinhaltung jetzt auch beim
   Bearbeiten editierbar**, nicht nur beim Erfassen/Reflektieren.
   Wichtig für CSV-importierte Trades, die diese Felder anfangs leer
   haben. Neue gemeinsame Emoji-Liste in `lib/tradeTags.ts` (13
   Emotionen: Ruhig, Zuversichtlich, Diszipliniert, Neutral, Müde,
   Nervös, Gestresst, Ungeduldig, Unsicher, Angst, Gier, FOMO, Rache),
   verwendet von der Vorher-Seite, der Reflexions-Seite und jetzt auch
   dem Bearbeiten-Formular — überall dieselben Optionen.
3. **Neues Widget „Mein Regelwerk":** persönliche Trading-Regeln (frei
   formulierter Text, eine Regel pro Zeile, max. 30) unter
   „Einstellungen" eintragen, erscheinen als nummerierte Checkliste auf
   dem Dashboard (`components/TradingRulesWidget.tsx`). Getrennt von der
   Regeleinhaltung pro Trade — das hier ist die eigene Regelliste selbst,
   nicht die Frage "hab ich mich dran gehalten". Neue Spalte
   `trading_rules` in `profiles` — bei bestehenden Datenbanken über
   `supabase/migration_rules.sql` nachziehen.

## 13. Trade-Detailseite / Replay-Klick, plus Statusklärung zu 4 gemeldeten Problemen

- **Trades in Replay/Hall of Fame/Shame sind jetzt klickbar**, öffnen
  `/trades/[id]` — neue Detailseite mit allen erfassten Daten
  (Entry/Exit, Emotionen, Regeleinhaltung, Notizen, Screenshot) plus
  einem kostenlosen TradingView-Chart für das Instrument
  (`lib/instrumentSymbols.ts` mappt rohe Instrument-Codes wie „ES"/„MES"
  auf ein anzeigbares Symbol, `components/TradingViewSymbolChart.tsx`).
  **Ehrlich dazu:** das zeigt den allgemeinen Marktverlauf, nicht den
  exakten Ein-/Ausstiegspunkt als Markierung im Chart eingezeichnet —
  ein echtes Kerze-für-Kerze-Replay mit eigenen Markierungen bräuchte
  TradingViews kostenpflichtige Charting-Library (eigene Freigabe von
  TradingView nötig), das ist hier nicht umgesetzt.
- **Coach-Trade-Schwelle:** im Code durchsucht, überall konsistent auf 5
  Trades gesetzt (nirgends 3), `fetchTrades` ohne jedes Limit — nutzt
  also bereits alle Journal-Trades. Konnte hier keinen Bug finden;
  vermutlich waren zum Testzeitpunkt tatsächlich noch keine 5 Trades
  erfasst, oder die Zahl wurde falsch erinnert.
- **Rangliste „konnte nicht geladen werden":** wahrscheinlich hat beim
  Ausführen der großen `migration_all.sql` eine frühere Zeile einen
  Fehler geworfen, der den Rest (inkl. `get_leaderboard()`-Funktion)
  gestoppt hat. Lösung: die kleinere, eigenständige
  `supabase/migration_leaderboard.sql` separat ausführen.
- **Musik-Link/Regelwerk „speichert nicht":** über eine Roh-Diagnose
  (temporär im Code, mittlerweile wieder entfernt) zweifelsfrei auf
  fehlerhafte Texteingabe zurückgeführt (z. B. „chttps://..." mit einem
  „c" zu viel, verstümmelter Text im Regelwerk-Feld) — Schreiben, RLS,
  Next.js-Caching und Anzeige funktionieren nachweislich korrekt.

## 14. Nächste Schritte (Priorität)

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
