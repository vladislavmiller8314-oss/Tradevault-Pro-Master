-- Migration: Post-Trade-Reflexion (Regeleinhaltung + Verbesserungsnotiz)
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

alter table trades
  add column if not exists rule_adherence text
    check (rule_adherence in ('eingehalten','teilweise','gebrochen')),
  add column if not exists improvement_note text;
