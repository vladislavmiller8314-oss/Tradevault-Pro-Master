-- Migration: Mehrere Strategien pro Trade (für die Statistik-Auswertung)
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

alter table trades
  add column if not exists strategy_tags text[] not null default array[]::text[];

NOTIFY pgrst, 'reload schema';
