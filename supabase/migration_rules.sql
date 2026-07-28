-- Migration: Persönliches Regelwerk (Widget)
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

alter table profiles
  add column if not exists trading_rules text[] not null default array[]::text[];
