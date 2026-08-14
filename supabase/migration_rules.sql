-- Migration: Persönliches Regelwerk (Widget)
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

alter table profiles
  add column if not exists trading_rules text[] not null default array[]::text[];

-- Bestehende Nutzer haben ein "active_widgets"-Array, das von VOR dieser
-- Funktion stammt und "trading_rules" deshalb noch nicht enthält — sonst
-- bliebe das neue Widget unsichtbar, obwohl man es unter Einstellungen
-- gar nicht erst manuell aktivieren müsste. Hier automatisch nachtragen:
update profiles
set active_widgets = array_append(active_widgets, 'trading_rules')
where not ('trading_rules' = any(active_widgets));

-- Erzwingt, dass Supabase die Tabellenstruktur sofort neu einliest,
-- statt bis zu ein paar Minuten auf den automatischen Cache-Refresh zu
-- warten (behebt "Could not find the 'trading_rules' column ... Schema
-- Cache"-Fehler direkt).
NOTIFY pgrst, 'reload schema';
