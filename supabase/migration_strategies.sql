-- Migration: Strategie-Liste (Widget unter dem Regelwerk)
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

alter table profiles
  add column if not exists strategies text[] not null default array[]::text[];

-- Bestehende Nutzer haben ein "active_widgets"-Array von VOR dieser
-- Funktion — hier automatisch nachtragen, damit das Widget direkt
-- sichtbar ist, ohne dass man es manuell unter Einstellungen suchen muss.
update profiles
set active_widgets = array_append(active_widgets, 'strategies')
where not ('strategies' = any(active_widgets));

NOTIFY pgrst, 'reload schema';
