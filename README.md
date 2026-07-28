# TradeVault Pro — Starter-Scaffold

## Setup

```bash
npm install
cp .env.local.example .env.local   # Supabase-Zugangsdaten eintragen
npm run dev
```

Öffnet unter `http://localhost:3000`.

Der „App installieren"-Button (unter Einstellungen) funktioniert auch
lokal auf `localhost`, da Browser das als sicheren Kontext werten — auf
einer echten Domain ohne HTTPS würde er nicht erscheinen.

## Supabase

1. Neues Projekt auf supabase.com anlegen
2. Im SQL-Editor den Inhalt von `supabase/schema.sql` ausführen
3. `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` aus
   den Projekt-Einstellungen in `.env.local` eintragen
4. Unter **Authentication → URL Configuration**: Site URL auf
   `http://localhost:3000` setzen (bzw. deine Domain in Produktion) und
   `http://localhost:3000/auth/callback` als Redirect URL hinzufügen
5. E-Mail-Bestätigung kann unter **Authentication → Providers → Email**
   für schnelleres lokales Testen vorübergehend deaktiviert werden
6. `schema.sql` legt automatisch auch den Storage-Bucket
   `trade-screenshots` inkl. Zugriffsrichtlinien an — kein manueller
   Schritt im Dashboard nötig
7. Falls du `schema.sql` schon vor der Post-Trade-Reflexion-Funktion
   ausgeführt hattest: zusätzlich `supabase/migration_reflection.sql`
   im SQL-Editor ausführen (fügt zwei neue Spalten zur `trades`-Tabelle hinzu)
8. Falls du `schema.sql` schon vor Widgets/Musik/Handbuch ausgeführt
   hattest: zusätzlich `supabase/migration_profiles.sql` ausführen (fügt
   `music_url` hinzu und legt automatisch Profile für bestehende Nutzer an)

## Erste Schritte nach dem Setup

1. Registrieren unter `/login`
2. Unter `/accounts` dein erstes Konto anlegen (Prop/Live/Demo/Evaluation)
3. Unter `/trades/new` deinen ersten Trade erfassen — P&L wird
   automatisch aus Entry/Exit/Kontrakte/Punktwert/Gebühren berechnet

## Deployment auf Vercel

1. Projekt zu einem GitHub-Repository pushen (privat oder öffentlich)
2. Auf [vercel.com](https://vercel.com) einloggen → **Add New → Project**
   → das Repository auswählen. Next.js wird automatisch erkannt, an den
   Build-Einstellungen muss nichts geändert werden.
3. Unter **Environment Variables** dieselben drei Werte eintragen wie in
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → hier die spätere Vercel-URL eintragen,
     z. B. `https://tradevault-pro.vercel.app` (oder deine eigene Domain)
   - Optional, nur für die zusätzliche Claude-Analyse im Coach:
     `ANTHROPIC_API_KEY` (eigener Key von console.anthropic.com, **ohne**
     `NEXT_PUBLIC_`-Präfix — verursacht Kosten auf deinem Anthropic-Konto).
     Ohne diese Variable funktioniert die kostenlose regelbasierte
     Coach-Analyse trotzdem ganz normal.
4. **Deploy** klicken
5. Nach dem ersten Deploy: in Supabase unter **Authentication → URL
   Configuration** die Vercel-URL sowohl als **Site URL** als auch mit
   `/auth/callback` als **Redirect URL** eintragen — sonst schlägt die
   Anmeldung in Produktion fehl, auch wenn sie lokal funktioniert
6. Eigene Domain verbinden: in Vercel unter **Settings → Domains** —
   danach Schritt 3 und 5 mit der eigenen Domain statt der vercel.app-URL
   wiederholen

Jeder Push auf den Hauptbranch deployt automatisch neu.

## Auth-Flow

- `/login` — Anmelden oder Konto erstellen (Server Actions in `app/login/actions.ts`)
- `middleware.ts` — erneuert die Session bei jedem Request und leitet
  nicht eingeloggte User automatisch auf `/login` um
- `app/auth/callback/route.ts` — nimmt den Bestätigungslink aus der
  E-Mail entgegen und tauscht ihn gegen eine Session
- Dashboard und Journal prüfen den User zusätzlich serverseitig
  (defense in depth) und zeigen die E-Mail + „Abmelden" in der TopBar

## Enthalten

- Login/Signup mit Supabase Auth (E-Mail/Passwort), Session-Handling
  über Middleware, geschützte Routen
- Konten-Verwaltung (`/accounts`): Konten anlegen und anzeigen
- Trade-Erfassung (`/trades/new`): vollständiges Formular inkl.
  Screenshot-Upload und automatischer P&L-Berechnung
- Schnelle Post-Trade-Reflexion (`/trades/[id]/reflect`): Emotion,
  Regeleinhaltung, Strategie und eine Verbesserungsnotiz per Tap in
  ~15 Sekunden, direkt nach dem Speichern eines Trades, überspringbar
- Dashboard mit Kern-KPIs, Equity Curve, Winrate-/Profit-Factor-Gauges,
  letzten Trades, Kontenübersicht — alles aus echten Supabase-Daten;
  Marktmonitor läuft live über **TradingView**, Wirtschaftskalender live
  über **Investing.com** (beide als kostenlose Embeds, kein API-Key nötig)
- Trade Journal (Tabellenansicht) — echte Daten, mit Empty State,
  inkl. Regeleinhaltung-Spalte
- Statistiken (`/stats`): Auswertung nach Instrument, Setup, Konto,
  Wochentag, Uhrzeit, Regeleinhaltung und Emotion
- Replay (`/replay`): Hall of Fame, Hall of Shame und eine Timeline aller
  Trades; im Journal markierst du Trades per 🏆/💀-Button
- Sidebar-Layout (`components/Sidebar.tsx` + `AppShell.tsx`) auf allen
  Seiten, mit aktiver Routen-Markierung und Abmelden
- Frei an-/abschaltbare Dashboard-Widgets (`/settings`)
- Musik-Button (🎵) in der Kopfzeile: Spotify-/Apple-Music-/YouTube-Music-/
  SoundCloud-Link einfügen, erscheint als eingebetteter Player — kein
  Login bei den Anbietern nötig
- Handbuch (`/help`): kurze Beschreibung jeder Funktion, erreichbar über
  den Link unten in der Sidebar
- Mobile Bottom-Nav (`components/MobileBottomNav.tsx`): unter 768px
  ersetzt eine App-artige Tab-Leiste die Sidebar, mit "Mehr"-Sheet für
  Konten/Einstellungen/Handbuch/Abmelden
- Konto-Filter auf dem Dashboard: bei mehreren Konten "Alle Konten" oder
  ein einzelnes Konto auswählen, filtert KPIs/Equity-Curve/Trades mit
- Ladezustände (Skeletons) auf jeder Seite mit Datenladevorgang, sowie
  eigene 404- und Fehlerseiten
- Installierbar als App (PWA) auf Windows, Mac, Android und iPhone/iPad
  — eigenes Icon, kein Browser-Rahmen, Button dafür unter „Einstellungen"
- Trades bearbeiten und löschen (im Journal, mit Bestätigungsdialog)
- Konten archivieren ("zu Inaktiv verschieben", bleiben erhalten,
  reaktivierbar) und endgültig löschen
- CSV-Import (`/trades/import`): Handelshistorie aus deiner Plattform
  hochladen statt einzeln einzutippen — erkennt Spalten automatisch,
  fasst einzelne Fills per FIFO zu Trades zusammen
- Teilgewinnmitnahme auch manuell: im Trade-Formular beliebig viele
  Ausstiege zu einem Entry hinzufügen, wird beim Speichern automatisch
  in mehrere Trades aufgeteilt
- Emotion vor dem Trade: eigener kurzer Schritt direkt nach dem Speichern,
  vor der bestehenden Reflexion — im Journal als „vorher → nachher" sichtbar
- Guthabenübersicht je Konto auf `/accounts`: echtes Live-Guthaben und
  Gesamt-P&L statt nur des unveränderten Startkapitals, plus Summenkarte
  über alle aktiven Konten
- Rangliste (`/leaderboard`, opt-in): Winrate & Profit Factor anonymisiert
  mit anderen Nutzern vergleichen, nie echte Beträge oder einzelne Trades
- Mehrfachauswahl im Journal: einzelne Trades per Checkbox auswählen
  (oder alle auf einmal) und gesammelt löschen, mit Bestätigungsdialog
- Coach (`/coach`): kostenlose, regelbasierte Musteranalyse deiner
  Statistiken ohne API-Key oder Kosten — plus optional eine
  Claude-Analyse für nuanciertere Hinweise (eigener `ANTHROPIC_API_KEY`
  nötig, verursacht dann Kosten auf deinem Anthropic-Konto)
- Emotion vorher/nachher und Regeleinhaltung jetzt auch nachträglich im
  Bearbeiten-Formular änderbar (per Emoji-Auswahl, 13 Emotionen zur Wahl)
- Widget „Mein Regelwerk": persönliche Trading-Regeln unter
  Einstellungen eintragen, erscheinen als Checkliste auf dem Dashboard
- "Trades heute"/Winrate/Profit-Factor-Bug auf dem Dashboard behoben
  (wurden bisher fälschlich nur aus den letzten 5 Trades berechnet)
- Supabase-Schema (Accounts, Trades, Equity-Snapshots, Replay-Highlights,
  Storage-Bucket für Screenshots, Row Level Security)
- Design-System nach Vorgabe (Farben, Inter/JetBrains Mono, Tailwind-Tokens)

## Noch offen

Siehe `SPEZIFIKATION.md`, Abschnitt 4 „Nächste Schritte" — u. a. das
Trade-Erfassungsformular, echte Daten statt Mock-Daten, Statistik- und
Replay-Seiten, Entscheidung zum Marktdaten-Anbieter.
