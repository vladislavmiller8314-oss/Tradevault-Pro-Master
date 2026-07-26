-- Migration: Emotion VOR dem Trade
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

alter table trades
  add column if not exists pre_trade_emotion text;
